namespace CampusDigitalTwin.Api.Domain.Entities;

public class ComplaintUpdate : BaseEntity
{
    public Guid ComplaintId { get; set; }
    public Complaint? Complaint { get; set; }
    public Guid UpdatedById { get; set; }
    public UserAccount? UpdatedBy { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
}
