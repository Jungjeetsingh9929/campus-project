using CampusDigitalTwin.Api.Application.Abstractions;
using CampusDigitalTwin.Api.Application.Contracts;
using CampusDigitalTwin.Api.Api.Hubs;
using CampusDigitalTwin.Api.Domain.Entities;
using CampusDigitalTwin.Api.Infrastructure.Persistence;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CampusDigitalTwin.Api.Application.Services;

public class CampusReadService : ICampusReadService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<NotificationsHub> _hub;

    public CampusReadService(AppDbContext db, IHubContext<NotificationsHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    public async Task<IReadOnlyList<CampusBuildingDto>> GetBuildingsAsync()
    {
        var buildings = await _db.CampusBuildings.Include(item => item.Classrooms).AsNoTracking().ToListAsync();
        return buildings.Select(item => new CampusBuildingDto(
            item.Id,
            item.Name,
            item.Block,
            item.Department,
            item.Purpose,
            item.Floors,
            item.X,
            item.Z,
            item.Occupancy,
            item.Capacity,
            item.WifiHealth,
            item.EnergyScore,
            item.CurrentLecture,
            item.NextLecture,
            item.AcStatus,
            item.ProjectorStatus,
            item.Availability,
            item.Classrooms.Select(room => new ClassroomDto(
                room.Id,
                room.RoomNumber,
                room.Department,
                room.Capacity,
                room.CurrentLecture,
                room.NextLecture,
                room.Occupancy,
                room.Availability,
                room.ProjectorStatus,
                room.AcStatus)).ToList())).ToList();
    }

    public async Task<IReadOnlyList<ClassroomDto>> GetClassroomsAsync()
    {
        var classrooms = await _db.Classrooms.AsNoTracking().ToListAsync();
        return classrooms.Select(room => new ClassroomDto(
            room.Id,
            room.RoomNumber,
            room.Department,
            room.Capacity,
            room.CurrentLecture,
            room.NextLecture,
            room.Occupancy,
            room.Availability,
            room.ProjectorStatus,
            room.AcStatus)).ToList();
    }

    public async Task<IReadOnlyList<WifiAccessPointDto>> GetWifiAsync()
    {
        var accessPoints = await _db.WifiAccessPoints.AsNoTracking().ToListAsync();
        return accessPoints.Select(ap => new WifiAccessPointDto(
            ap.Id,
            ap.CampusBuildingId,
            ap.Name,
            ap.Status,
            ap.ConnectedUsers,
            ap.BandwidthMbps,
            ap.LatencyMs,
            ap.PacketLossPercent)).ToList();
    }

    public async Task<IReadOnlyList<EnergySnapshotDto>> GetEnergyAsync()
    {
        var snapshots = await _db.EnergySnapshots.AsNoTracking().ToListAsync();
        return snapshots.Select(item => new EnergySnapshotDto(
            item.Id,
            item.CampusBuildingId,
            item.ElectricityKwh,
            item.WaterLiters,
            item.SolarKwh,
            item.CarbonKg)).ToList();
    }

    public async Task<AnalyticsSnapshotDto> GetAnalyticsAsync()
    {
        var buildings = await _db.CampusBuildings.CountAsync();
        var complaints = await _db.Complaints.CountAsync();
        var wifi = await _db.WifiAccessPoints.CountAsync();

        return new AnalyticsSnapshotDto(buildings, complaints, wifi);
    }

    public async Task RecordEmergencyAsync(EmergencyRequest request, ClaimsPrincipal principal)
    {
        ValidateEmergencyRequest(request);
        var id = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var user = Guid.TryParse(id, out var userId)
            ? await _db.Users.FirstOrDefaultAsync(item => item.Id == userId)
            : null;

        if (user is null)
        {
            throw new InvalidOperationException("Authenticated user was not found.");
        }

        var emergency = new EmergencyEvent
        {
            Kind = request.Kind,
            Location = request.Location,
            Notes = request.Notes,
            Severity = request.Severity,
            AssignedTeam = request.AssignedTeam,
            Status = "NotConfigured",
            CreatedById = user.Id,
        };
        _db.EmergencyEvents.Add(emergency);
        _db.AuditRecords.Add(new AuditRecord
        {
            ActorId = user.Id,
            ActorName = user.DisplayName,
            Action = request.Kind,
            Target = request.Location,
        });
        await _db.SaveChangesAsync();
        await _hub.Clients.Group("role:Security").SendAsync("EmergencyCreated", emergency);
        await _hub.Clients.Group("role:Admin").SendAsync("EmergencyCreated", emergency);
    }

    private static readonly HashSet<string> AllowedEmergencyTypes = ["SOS button", "Medical emergency", "Fire response", "Evacuation support", "Alert all users", "Trigger sirens"];
    private static readonly HashSet<string> AllowedEmergencySeverities = ["Medium", "High", "Critical"];

    private static void ValidateEmergencyRequest(EmergencyRequest request)
    {
        if (!AllowedEmergencyTypes.Contains(request.Kind))
        {
            throw new ArgumentException("Invalid emergency action type.");
        }

        if (!AllowedEmergencySeverities.Contains(request.Severity))
        {
            throw new ArgumentException("Invalid emergency severity.");
        }

        if (string.IsNullOrWhiteSpace(request.Location) || request.Location.Length > 160)
        {
            throw new ArgumentException("Emergency location is required and must be 160 characters or fewer.");
        }

        if (string.IsNullOrWhiteSpace(request.Notes) || request.Notes.Length is < 8 or > 1000)
        {
            throw new ArgumentException("Emergency notes must be between 8 and 1000 characters.");
        }

        if (string.IsNullOrWhiteSpace(request.AssignedTeam) || request.AssignedTeam.Length > 120)
        {
            throw new ArgumentException("Assigned team is required and must be 120 characters or fewer.");
        }
    }
}
