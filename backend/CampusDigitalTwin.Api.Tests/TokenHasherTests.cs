using CampusDigitalTwin.Api.Infrastructure.Security;

namespace CampusDigitalTwin.Api.Tests;

public class TokenHasherTests
{
    [Fact]
    public void CreateOpaqueToken_ReturnsUniqueHighEntropyValues()
    {
        var first = TokenHasher.CreateOpaqueToken();
        var second = TokenHasher.CreateOpaqueToken();

        Assert.NotEqual(first, second);
        Assert.True(first.Length >= 60);
        Assert.True(second.Length >= 60);
    }

    [Fact]
    public void Hash_DoesNotExposeRawToken()
    {
        var token = TokenHasher.CreateOpaqueToken();
        var hash = TokenHasher.Hash(token);

        Assert.NotEqual(token, hash);
        Assert.Equal(hash, TokenHasher.Hash(token));
    }
}
