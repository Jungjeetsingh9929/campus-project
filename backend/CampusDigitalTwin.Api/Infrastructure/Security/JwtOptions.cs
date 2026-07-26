namespace CampusDigitalTwin.Api.Infrastructure.Security;

public class JwtOptions
{
    public string Issuer { get; set; } = "CampusDigitalTwin";
    public string Audience { get; set; } = "CampusDigitalTwinWeb";
    public string SigningKey { get; set; } = "replace-this-signing-key-with-a-strong-secret";
    public int AccessTokenMinutes { get; set; } = 60;
    public int RefreshTokenDays { get; set; } = 30;
}
