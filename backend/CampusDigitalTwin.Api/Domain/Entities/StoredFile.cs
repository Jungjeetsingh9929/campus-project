namespace CampusDigitalTwin.Api.Domain.Entities;

public class StoredFile : BaseEntity
{
    public Guid OwnerId { get; set; }
    public UserAccount? Owner { get; set; }
    public Guid? ComplaintId { get; set; }
    public Complaint? Complaint { get; set; }
    public string StorageKey { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
    public long Size { get; set; }
    public string Purpose { get; set; } = "ComplaintEvidence";
}
