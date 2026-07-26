namespace CampusDigitalTwin.Api.Domain.Entities;

public class EnergySnapshot : BaseEntity
{
    public Guid CampusBuildingId { get; set; }
    public int ElectricityKwh { get; set; }
    public int WaterLiters { get; set; }
    public int SolarKwh { get; set; }
    public int CarbonKg { get; set; }
}
