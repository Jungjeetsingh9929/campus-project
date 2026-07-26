namespace CampusDigitalTwin.Api.Domain.Entities;

public class AuditRecord : BaseEntity
{
    public Guid ActorId { get; set; }
    public UserAccount? Actor { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
}
