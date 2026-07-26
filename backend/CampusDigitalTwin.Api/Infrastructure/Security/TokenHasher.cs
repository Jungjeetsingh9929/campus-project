using System.Security.Cryptography;
using Microsoft.AspNetCore.WebUtilities;

namespace CampusDigitalTwin.Api.Infrastructure.Security;

public static class TokenHasher
{
    public static string CreateOpaqueToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(48);
        return WebEncoders.Base64UrlEncode(bytes);
    }

    public static string Hash(string token)
    {
        var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
