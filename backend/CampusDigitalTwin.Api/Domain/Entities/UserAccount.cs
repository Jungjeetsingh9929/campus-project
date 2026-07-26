namespace CampusDigitalTwin.Api.Domain.Entities;

public class UserAccount : BaseEntity
{
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? RollNumber { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;
    public int FailedLoginAttempts { get; set; }
    public DateTimeOffset? LockedUntil { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
}
