using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CampusDigitalTwin.Api.Application.Abstractions;
using CampusDigitalTwin.Api.Application.Contracts;
using CampusDigitalTwin.Api.Api.Hubs;
using CampusDigitalTwin.Api.Domain.Entities;
using CampusDigitalTwin.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CampusDigitalTwin.Api.Application.Services;

public class ComplaintService : IComplaintService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<NotificationsHub> _hub;

    public ComplaintService(AppDbContext db, IHubContext<NotificationsHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    public async Task<ComplaintDto> CreateAsync(CreateComplaintRequest request, ClaimsPrincipal principal)
    {
        ValidateCreateRequest(request);
        var user = await GetUserAsync(principal) ?? throw new InvalidOperationException("Authenticated user was not found.");
        var building = await _db.CampusBuildings.FirstOrDefaultAsync(item => item.Block == request.BuildingId || item.Id.ToString() == request.BuildingId);
        if (building is null)
        {
            throw new ArgumentException("Invalid building ID.");
        }

        var sequence = await _db.Database.SqlQueryRaw<long>("SELECT nextval('complaint_ticket_sequence')").SingleAsync();
        var ticketNo = $"CMP-{DateTimeOffset.UtcNow.Year}-{sequence:000000}";
        var complaint = new Complaint
        {
            TicketNo = ticketNo,
            StudentId = user.Id,
            StudentName = user.DisplayName,
            RollNumber = user.RollNumber,
            Contact = string.IsNullOrWhiteSpace(request.Contact) ? user.Email : request.Contact,
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            Priority = request.Priority,
            CampusBuildingId = building.Id,
            RoomNumber = request.RoomNumber,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Status = "Open",
            AssignedDepartment = RouteDepartment(request.Category),
            Technician = "Pending assignment",
            EstimatedCompletion = EstimateSla(request.Priority),
            Images = request.Images,
        };

        complaint.Updates.Add(new ComplaintUpdate
        {
            UpdatedById = user.Id,
            Status = complaint.Status,
            Note = $"Complaint registered and routed to {complaint.AssignedDepartment}.",
        });

        _db.Complaints.Add(complaint);
        _db.AuditRecords.Add(new AuditRecord
        {
            ActorId = user.Id,
            ActorName = user.DisplayName,
            Action = "Created complaint",
            Target = ticketNo,
        });
        await _db.SaveChangesAsync();
        await _hub.Clients.Group("role:Admin").SendAsync("ComplaintCreated", ToDto(complaint));
        await _hub.Clients.Group($"user:{user.Id}").SendAsync("NotificationCreated", new { title = "Complaint submitted", message = $"{ticketNo} was created." });

        return ToDto(complaint);
    }

    public async Task<IReadOnlyList<ComplaintDto>> GetComplaintsAsync(ClaimsPrincipal principal)
    {
        var user = await GetUserAsync(principal) ?? throw new InvalidOperationException("Authenticated user was not found.");
        var query = _db.Complaints.Include(item => item.Updates).ThenInclude(item => item.UpdatedBy).AsNoTracking();

        if (user.Role == "Student")
        {
            query = query.Where(item => item.StudentId == user.Id);
        }
        else if (user.Role == "Faculty")
        {
            query = query.Where(item =>
                item.AssignedDepartment.Contains("IT") ||
                item.AssignedDepartment.Contains("Lab") ||
                item.Category == "Laboratory" ||
                item.Category == "Internet");
        }

        var complaints = await query.OrderByDescending(item => item.CreatedAt).ToListAsync();
        return complaints.Select(ToDto).ToList();
    }

    public async Task<ComplaintDto?> UpdateAsync(Guid id, UpdateComplaintRequest request, ClaimsPrincipal principal)
    {
        if (!AllowedStatuses.Contains(request.Status))
        {
            throw new ArgumentException("Invalid complaint status.");
        }

        var user = await GetUserAsync(principal);
        if (user is null || (user.Role != "Admin" && user.Role != "Faculty"))
        {
            return null;
        }

        var complaint = await _db.Complaints.Include(item => item.Updates).FirstOrDefaultAsync(item => item.Id == id);
        if (complaint is null)
        {
            return null;
        }

        if (user.Role == "Faculty" && !IsFacultyScoped(user, complaint))
        {
            return null;
        }

        complaint.Status = request.Status;
        complaint.AssignedDepartment = request.AssignedDepartment;
        complaint.Technician = request.Technician;
        complaint.EstimatedCompletion = request.EstimatedCompletion;
        complaint.AdminRemarks = request.AdminRemarks;
        complaint.ResolutionEvidence = request.ResolutionEvidence;
        complaint.ResolvedAt = request.Status == "Resolved" ? DateTimeOffset.UtcNow : complaint.ResolvedAt;
        complaint.UpdatedAt = DateTimeOffset.UtcNow;
        complaint.Updates.Add(new ComplaintUpdate
        {
            UpdatedById = user.Id,
            Status = request.Status,
            Note = string.IsNullOrWhiteSpace(request.AdminRemarks) ? $"Status updated to {request.Status}." : request.AdminRemarks,
        });
        _db.AuditRecords.Add(new AuditRecord
        {
            ActorId = user.Id,
            ActorName = user.DisplayName,
            Action = $"Updated complaint to {request.Status}",
            Target = complaint.TicketNo,
        });

        await _db.SaveChangesAsync();
        var dto = ToDto(complaint);
        await _hub.Clients.Group("role:Admin").SendAsync("ComplaintUpdated", dto);
        await _hub.Clients.Group($"user:{complaint.StudentId}").SendAsync("ComplaintUpdated", dto);
        return dto;
    }

    private async Task<UserAccount?> GetUserAsync(ClaimsPrincipal principal)
    {
        var id = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(id, out var userId)
            ? await _db.Users.FirstOrDefaultAsync(item => item.Id == userId && item.IsActive)
            : null;
    }

    private static readonly HashSet<string> AllowedCategories = ["Electrical", "Water", "Internet", "Furniture", "Cleaning", "Hostel", "Library", "Laboratory"];
    private static readonly HashSet<string> AllowedPriorities = ["Low", "Medium", "High", "Critical"];
    private static readonly HashSet<string> AllowedStatuses = ["Open", "Assigned", "In Progress", "Resolved"];

    private static void ValidateCreateRequest(CreateComplaintRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Length is < 5 or > 160)
        {
            throw new ArgumentException("Complaint title must be between 5 and 160 characters.");
        }

        if (string.IsNullOrWhiteSpace(request.Description) || request.Description.Length is < 15 or > 3000)
        {
            throw new ArgumentException("Complaint description must be between 15 and 3000 characters.");
        }

        if (!AllowedCategories.Contains(request.Category))
        {
            throw new ArgumentException("Invalid complaint category.");
        }

        if (!AllowedPriorities.Contains(request.Priority))
        {
            throw new ArgumentException("Invalid complaint priority.");
        }

        if (string.IsNullOrWhiteSpace(request.RoomNumber) || request.RoomNumber.Length > 40)
        {
            throw new ArgumentException("Room number is required and must be 40 characters or fewer.");
        }

        if (request.Latitude is < -90 or > 90 || request.Longitude is < -180 or > 180)
        {
            throw new ArgumentException("Invalid GPS coordinates.");
        }

        if (request.Images.Length > 5)
        {
            throw new ArgumentException("A complaint can include at most 5 attachments.");
        }
    }

    private static bool IsFacultyScoped(UserAccount user, Complaint complaint)
    {
        return !string.IsNullOrWhiteSpace(user.Department) &&
            (complaint.AssignedDepartment.Contains(user.Department, StringComparison.OrdinalIgnoreCase) ||
             complaint.Category is "Laboratory" or "Internet");
    }

    private static ComplaintDto ToDto(Complaint complaint)
    {
        return new ComplaintDto(
            complaint.Id,
            complaint.TicketNo,
            complaint.StudentId,
            complaint.StudentName,
            complaint.RollNumber,
            complaint.Contact,
            complaint.CampusBuildingId,
            complaint.Title,
            complaint.Description,
            complaint.Category,
            complaint.Priority,
            complaint.RoomNumber,
            complaint.Status,
            complaint.AssignedDepartment,
            complaint.Technician,
            complaint.EstimatedCompletion,
            complaint.Latitude,
            complaint.Longitude,
            complaint.Images,
            complaint.AdminRemarks,
            complaint.ResolutionEvidence,
            complaint.CreatedAt,
            complaint.UpdatedAt,
            complaint.ResolvedAt,
            complaint.Updates
                .OrderBy(item => item.CreatedAt)
                .Select(item => new ComplaintUpdateDto(item.CreatedAt, item.UpdatedBy?.DisplayName ?? "System", item.Status, item.Note))
                .ToList());
    }

    private static string RouteDepartment(string category)
    {
        return category switch
        {
            "Electrical" => "Electrical Maintenance",
            "Water" => "Facilities",
            "Internet" => "IT Cell",
            "Furniture" => "Facilities",
            "Cleaning" => "Housekeeping",
            "Hostel" => "Hostel Office",
            "Library" => "Library Desk",
            "Laboratory" => "Lab Operations",
            _ => "Campus Services",
        };
    }

    private static string EstimateSla(string priority)
    {
        var hours = priority switch
        {
            "Critical" => 4,
            "High" => 24,
            "Medium" => 48,
            _ => 72,
        };
        return DateTimeOffset.UtcNow.AddHours(hours).ToString("u");
    }
}
