namespace CampusDigitalTwin.Api.Domain.Entities;

public class NotificationRecord : BaseEntity
{
    public Guid UserAccountId { get; set; }
    public UserAccount? UserAccount { get; set; }
    public string Type { get; set; } = "Info";
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? RelatedEntityId { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}
