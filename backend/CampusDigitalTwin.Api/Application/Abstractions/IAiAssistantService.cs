namespace CampusDigitalTwin.Api.Application.Abstractions;

public interface IAiAssistantService
{
    Task<string> AnswerAsync(string query);
}
