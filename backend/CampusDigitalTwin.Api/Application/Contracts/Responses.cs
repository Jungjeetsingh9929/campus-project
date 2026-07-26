namespace CampusDigitalTwin.Api.Application.Contracts;

public record ClassroomDto(
    Guid Id,
    string RoomNumber,
    string Department,
    int Capacity,
    string CurrentLecture,
    string NextLecture,
    int Occupancy,
    string Availability,
    string ProjectorStatus,
    string AcStatus);

public record CampusBuildingDto(
    Guid Id,
    string Name,
    string Block,
    string Department,
    string Purpose,
    int Floors,
    double X,
    double Z,
    double Occupancy,
    int Capacity,
    string WifiHealth,
    int EnergyScore,
    string CurrentLecture,
    string NextLecture,
    string AcStatus,
    string ProjectorStatus,
    string Availability,
    IReadOnlyList<ClassroomDto> Classrooms);

public record ComplaintDto(
    Guid Id,
    string TicketNo,
    Guid StudentId,
    string StudentName,
    string? RollNumber,
    string Contact,
    Guid CampusBuildingId,
    string Title,
    string Description,
    string Category,
    string Priority,
    string RoomNumber,
    string Status,
    string AssignedDepartment,
    string Technician,
    string EstimatedCompletion,
    double Latitude,
    double Longitude,
    string[] Images,
    string AdminRemarks,
    string[] ResolutionEvidence,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? ResolvedAt,
    IReadOnlyList<ComplaintUpdateDto> Updates);

public record ComplaintUpdateDto(
    DateTimeOffset At,
    string UpdatedBy,
    string Status,
    string Note);

public record UserDto(
    Guid Id,
    string Name,
    string Email,
    string Role,
    string Department,
    string? RollNumber,
    string? Phone,
    bool IsActive);

public record EmergencyEventDto(
    Guid Id,
    string Kind,
    string Location,
    string Notes,
    string Severity,
    string Status,
    string AssignedTeam,
    string CreatedBy,
    DateTimeOffset CreatedAt);

public record AuditRecordDto(
    Guid Id,
    string ActorName,
    string Action,
    string Target,
    DateTimeOffset CreatedAt);

public record UploadResponse(string Url, string FileName, string ContentType, long Size);

public record WifiAccessPointDto(
    Guid Id,
    Guid CampusBuildingId,
    string Name,
    string Status,
    int ConnectedUsers,
    int BandwidthMbps,
    int LatencyMs,
    double PacketLossPercent);

public record EnergySnapshotDto(
    Guid Id,
    Guid CampusBuildingId,
    int ElectricityKwh,
    int WaterLiters,
    int SolarKwh,
    int CarbonKg);

public record AnalyticsSnapshotDto(
    int CampusBuildings,
    int Complaints,
    int WifiAccessPoints);
