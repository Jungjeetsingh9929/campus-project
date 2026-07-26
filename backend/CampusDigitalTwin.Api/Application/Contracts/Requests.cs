namespace CampusDigitalTwin.Api.Application.Contracts;

public record LoginRequest(string Email, string Password);
public record RefreshRequest(string? RefreshToken = null);
public record RegisterStudentRequest(string Name, string Email, string Password, string RollNumber, string Phone);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword, string ConfirmPassword);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record UpdateUserRequest(string DisplayName, string Role, string Department, string? RollNumber, string? Phone, bool IsActive);
public record CreateComplaintRequest(
    string Title,
    string Description,
    string Category,
    string Priority,
    string BuildingId,
    string RoomNumber,
    double Latitude,
    double Longitude,
    string Contact,
    string[] Images);
public record UpdateComplaintRequest(
    string Status,
    string AssignedDepartment,
    string Technician,
    string EstimatedCompletion,
    string AdminRemarks,
    string[] ResolutionEvidence);
public record AiQueryRequest(string Query);
public record EmergencyRequest(string Kind, string Location, string Notes, string Severity = "High", string AssignedTeam = "Security Response Team");
