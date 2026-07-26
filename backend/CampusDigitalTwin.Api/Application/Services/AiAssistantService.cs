using CampusDigitalTwin.Api.Application.Abstractions;
using CampusDigitalTwin.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CampusDigitalTwin.Api.Application.Services;

public class AiAssistantService : IAiAssistantService
{
    private readonly AppDbContext _db;

    public AiAssistantService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<string> AnswerAsync(string query)
    {
        var normalized = query.ToLowerInvariant();

        if (normalized.Contains("free classroom"))
        {
            var room = await _db.Classrooms.FirstOrDefaultAsync(item => item.Availability == "Available");
            return room is null
                ? "Rules assistant: no free classroom is currently available."
                : $"Rules assistant: the nearest free classroom is {room.RoomNumber} in {room.Department}.";
        }

        if (normalized.Contains("electricity"))
        {
            var building = await _db.CampusBuildings.OrderByDescending(item => item.EnergyScore).FirstAsync();
            return $"Rules assistant: {building.Block} is currently the highest-energy building.";
        }

        if (normalized.Contains("complaint"))
        {
            var count = await _db.Complaints.CountAsync(item => item.Status != "Resolved");
            return $"Rules assistant: there are {count} unresolved complaints right now.";
        }

        return "Rules assistant: I can search campus buildings, complaints, Wi-Fi, energy, and navigation data. Configure Azure OpenAI before presenting this as generative AI.";
    }
}
