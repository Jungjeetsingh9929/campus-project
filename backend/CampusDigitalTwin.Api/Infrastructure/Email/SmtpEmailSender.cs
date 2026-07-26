using System.Net;
using System.Net.Mail;
using CampusDigitalTwin.Api.Application.Abstractions;
using CampusDigitalTwin.Api.Domain.Entities;

namespace CampusDigitalTwin.Api.Infrastructure.Email;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendPasswordResetAsync(UserAccount user, string resetUrl)
    {
        var host = _configuration["Smtp:Host"];
        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogWarning("SMTP host is not configured; password-reset email was not sent for user {UserId}.", user.Id);
            return;
        }

        var port = int.TryParse(_configuration["Smtp:Port"], out var configuredPort) ? configuredPort : 587;
        var username = _configuration["Smtp:Username"];
        var password = _configuration["Smtp:Password"];
        var from = _configuration["Smtp:From"] ?? username;

        if (string.IsNullOrWhiteSpace(from))
        {
            _logger.LogWarning("SMTP from address is not configured; password-reset email was not sent for user {UserId}.", user.Id);
            return;
        }

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = true,
        };

        if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
        {
            client.Credentials = new NetworkCredential(username, password);
        }

        using var message = new MailMessage(from, user.Email)
        {
            Subject = "Reset your Campus Digital Twin password",
            Body = $"Use this secure link to reset your password. It expires soon:\n\n{resetUrl}",
        };

        await client.SendMailAsync(message);
    }
}
