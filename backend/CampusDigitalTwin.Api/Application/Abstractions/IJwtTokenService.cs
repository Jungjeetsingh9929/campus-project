using CampusDigitalTwin.Api.Domain.Entities;

namespace CampusDigitalTwin.Api.Application.Abstractions;

public interface IJwtTokenService
{
    TokenPair CreateTokens(UserAccount user);
}

public record TokenPair(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt,
    DateTimeOffset RefreshTokenExpiresAt,
    string Role = "",
    string Name = "");
