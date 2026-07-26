using CampusDigitalTwin.Api.Domain.Entities;

namespace CampusDigitalTwin.Api.Application.Abstractions;

public interface IEmailSender
{
    Task SendPasswordResetAsync(UserAccount user, string resetLink);
}
