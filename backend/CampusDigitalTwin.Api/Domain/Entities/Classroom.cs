namespace CampusDigitalTwin.Api.Domain.Entities;

public class Classroom : BaseEntity
{
    public Guid CampusBuildingId { get; set; }
    public CampusBuilding? CampusBuilding { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string CurrentLecture { get; set; } = string.Empty;
    public string NextLecture { get; set; } = string.Empty;
    public int Occupancy { get; set; }
    public string Availability { get; set; } = string.Empty;
    public string ProjectorStatus { get; set; } = string.Empty;
    public string AcStatus { get; set; } = string.Empty;
}
