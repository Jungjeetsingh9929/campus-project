namespace CampusDigitalTwin.Api.Application.Abstractions;

public interface IComplaintService
{
    Task<CampusDigitalTwin.Api.Application.Contracts.ComplaintDto> CreateAsync(CampusDigitalTwin.Api.Application.Contracts.CreateComplaintRequest request, System.Security.Claims.ClaimsPrincipal user);
    Task<IReadOnlyList<CampusDigitalTwin.Api.Application.Contracts.ComplaintDto>> GetComplaintsAsync(System.Security.Claims.ClaimsPrincipal user);
    Task<CampusDigitalTwin.Api.Application.Contracts.ComplaintDto?> UpdateAsync(Guid id, CampusDigitalTwin.Api.Application.Contracts.UpdateComplaintRequest request, System.Security.Claims.ClaimsPrincipal user);
}
