namespace CampusDigitalTwin.Api.Domain.Entities;

public class PasswordResetToken : BaseEntity
{
    public Guid UserAccountId { get; set; }
    public UserAccount? UserAccount { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? UsedAt { get; set; }
}
