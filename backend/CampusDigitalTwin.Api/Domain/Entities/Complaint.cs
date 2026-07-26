namespace CampusDigitalTwin.Api.Domain.Entities;

public class Complaint : BaseEntity
{
    public string TicketNo { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public UserAccount? Student { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? RollNumber { get; set; }
    public string Contact { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public Guid CampusBuildingId { get; set; }
    public CampusBuilding? CampusBuilding { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Status { get; set; } = "Open";
    public string AssignedDepartment { get; set; } = string.Empty;
    public string Technician { get; set; } = string.Empty;
    public string EstimatedCompletion { get; set; } = string.Empty;
    public string[] Images { get; set; } = [];
    public string AdminRemarks { get; set; } = string.Empty;
    public string[] ResolutionEvidence { get; set; } = [];
    public DateTimeOffset? ResolvedAt { get; set; }
    public List<ComplaintUpdate> Updates { get; set; } = [];
}
