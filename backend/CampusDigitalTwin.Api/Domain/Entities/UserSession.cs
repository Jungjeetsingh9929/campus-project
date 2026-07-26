namespace CampusDigitalTwin.Api.Domain.Entities;

public class UserSession : BaseEntity
{
    public Guid UserAccountId { get; set; }
    public UserAccount? UserAccount { get; set; }
    public string RefreshTokenHash { get; set; } = string.Empty;
    public Guid TokenFamilyId { get; set; } = Guid.NewGuid();
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public Guid? ReplacedByTokenId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
