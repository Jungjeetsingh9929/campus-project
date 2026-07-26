using CampusDigitalTwin.Api.Application.Abstractions;
using CampusDigitalTwin.Api.Domain.Entities;

namespace CampusDigitalTwin.Api.Infrastructure.Email;

public class DevelopmentEmailSender : IEmailSender
{
    private readonly ILogger<DevelopmentEmailSender> _logger;

    public DevelopmentEmailSender(ILogger<DevelopmentEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendPasswordResetAsync(UserAccount user, string resetLink)
    {
        _logger.LogInformation("Development password reset link generated for {Email}: {ResetLink}", user.Email, resetLink);
        return Task.CompletedTask;
    }
}
