namespace CampusDigitalTwin.Api.Domain.Entities;

public class EmergencyEvent : BaseEntity
{
    public string Kind { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string Severity { get; set; } = "High";
    public string Status { get; set; } = "Active";
    public string AssignedTeam { get; set; } = "Security Response Team";
    public Guid CreatedById { get; set; }
    public UserAccount? CreatedBy { get; set; }
}
