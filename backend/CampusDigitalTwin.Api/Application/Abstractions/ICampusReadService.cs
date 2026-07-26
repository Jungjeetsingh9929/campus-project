namespace CampusDigitalTwin.Api.Application.Abstractions;

public interface ICampusReadService
{
    Task<IReadOnlyList<CampusDigitalTwin.Api.Application.Contracts.CampusBuildingDto>> GetBuildingsAsync();
    Task<IReadOnlyList<CampusDigitalTwin.Api.Application.Contracts.ClassroomDto>> GetClassroomsAsync();
    Task<IReadOnlyList<CampusDigitalTwin.Api.Application.Contracts.WifiAccessPointDto>> GetWifiAsync();
    Task<IReadOnlyList<CampusDigitalTwin.Api.Application.Contracts.EnergySnapshotDto>> GetEnergyAsync();
    Task<CampusDigitalTwin.Api.Application.Contracts.AnalyticsSnapshotDto> GetAnalyticsAsync();
    Task RecordEmergencyAsync(CampusDigitalTwin.Api.Application.Contracts.EmergencyRequest request, System.Security.Claims.ClaimsPrincipal user);
}
