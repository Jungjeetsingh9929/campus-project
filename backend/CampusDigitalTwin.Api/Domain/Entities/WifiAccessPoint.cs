namespace CampusDigitalTwin.Api.Domain.Entities;

public class WifiAccessPoint : BaseEntity
{
    public Guid CampusBuildingId { get; set; }
    public CampusBuilding CampusBuilding { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int ConnectedUsers { get; set; }
    public int BandwidthMbps { get; set; }
    public int LatencyMs { get; set; }
    public double PacketLossPercent { get; set; }
}
