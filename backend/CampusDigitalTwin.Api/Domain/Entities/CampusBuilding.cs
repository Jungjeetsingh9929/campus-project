namespace CampusDigitalTwin.Api.Domain.Entities;

public class CampusBuilding : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Block { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public int Floors { get; set; }
    public double X { get; set; }
    public double Z { get; set; }
    public double Occupancy { get; set; }
    public int Capacity { get; set; }
    public string WifiHealth { get; set; } = string.Empty;
    public int EnergyScore { get; set; }
    public string CurrentLecture { get; set; } = string.Empty;
    public string NextLecture { get; set; } = string.Empty;
    public string AcStatus { get; set; } = string.Empty;
    public string ProjectorStatus { get; set; } = string.Empty;
    public string Availability { get; set; } = string.Empty;
    public List<Classroom> Classrooms { get; set; } = new();
}
