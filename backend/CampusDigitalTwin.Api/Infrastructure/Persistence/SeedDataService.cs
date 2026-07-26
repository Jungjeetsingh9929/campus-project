using CampusDigitalTwin.Api.Domain.Entities;
using CampusDigitalTwin.Api.Infrastructure.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CampusDigitalTwin.Api.Infrastructure.Persistence;

public interface ISeedDataService
{
    Task InitializeAsync();
}

public class SeedDataService : ISeedDataService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public SeedDataService(AppDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public async Task InitializeAsync()
    {
        var migrations = await _db.Database.GetMigrationsAsync();
        if (migrations.Any())
        {
            await _db.Database.MigrateAsync();
        }
        else
        {
            await _db.Database.EnsureCreatedAsync();
        }

        if (await _db.Users.AnyAsync())
        {
            return;
        }

        var hasher = new PasswordHasher<UserAccount>();
        var admin = new UserAccount
        {
            DisplayName = "Campus Admin",
            Email = "admin@campus.edu",
            Role = "Admin",
            Department = "Administration",
        };
        admin.PasswordHash = hasher.HashPassword(admin, GetSeedPassword());

        var student = new UserAccount
        {
            DisplayName = "Student User",
            Email = "student@campus.edu",
            Role = "Student",
            Department = "Computer Science",
            RollNumber = "UEM-2026-014",
            Phone = "+91 90000 10001",
        };
        student.PasswordHash = hasher.HashPassword(student, GetSeedPassword());

        var faculty = new UserAccount
        {
            DisplayName = "Faculty User",
            Email = "faculty@campus.edu",
            Role = "Faculty",
            Department = "Computer Science",
        };
        faculty.PasswordHash = hasher.HashPassword(faculty, GetSeedPassword());

        var security = new UserAccount
        {
            DisplayName = "Security Guard",
            Email = "security@campus.edu",
            Role = "Security",
            Department = "Security",
            Phone = "+91 90000 10004",
        };
        security.PasswordHash = hasher.HashPassword(security, GetSeedPassword());

        _db.Users.AddRange(admin, student, faculty, security);

        var blockA = new CampusBuilding
        {
            Name = "Academic Block A",
            Block = "Block A",
            Department = "Computer Science",
            Purpose = "Lecture halls and labs",
            Floors = 4,
            X = -10,
            Z = -6,
            Occupancy = 68,
            Capacity = 180,
            WifiHealth = "Online",
            EnergyScore = 72,
            CurrentLecture = "Data Structures",
            NextLecture = "AI Systems",
            AcStatus = "On",
            ProjectorStatus = "On",
            Availability = "Reserved",
            Classrooms =
            [
                new Classroom
                {
                    RoomNumber = "A-101",
                    Department = "Computer Science",
                    Capacity = 60,
                    CurrentLecture = "Data Structures",
                    NextLecture = "Machine Learning",
                    Occupancy = 54,
                    Availability = "Occupied",
                    ProjectorStatus = "On",
                    AcStatus = "On",
                }
            ]
        };

        var blockC = new CampusBuilding
        {
            Name = "Library & Knowledge Hub",
            Block = "Block C",
            Department = "Library",
            Purpose = "Study, research and collaboration",
            Floors = 3,
            X = 10,
            Z = -6,
            Occupancy = 86,
            Capacity = 220,
            WifiHealth = "Online",
            EnergyScore = 64,
            CurrentLecture = "Study Hall",
            NextLecture = "Research Clinic",
            AcStatus = "On",
            ProjectorStatus = "Off",
            Availability = "Occupied",
            Classrooms =
            [
                new Classroom
                {
                    RoomNumber = "C-Studio",
                    Department = "Library",
                    Capacity = 80,
                    CurrentLecture = "Study Hall",
                    NextLecture = "Research Clinic",
                    Occupancy = 77,
                    Availability = "Occupied",
                    ProjectorStatus = "Off",
                    AcStatus = "On",
                }
            ]
        };

        var blockB = new CampusBuilding
        {
            Name = "Administration Block",
            Block = "Block B",
            Department = "Administration",
            Purpose = "Admissions and governance",
            Floors = 5,
            X = 0,
            Z = -6,
            Occupancy = 49,
            Capacity = 120,
            WifiHealth = "Weak Signal",
            EnergyScore = 58,
            CurrentLecture = "Board Review",
            NextLecture = "Budget Meeting",
            AcStatus = "On",
            ProjectorStatus = "On",
            Availability = "Occupied",
        };

        var blockD = new CampusBuilding
        {
            Name = "Engineering Lab Complex",
            Block = "Block D",
            Department = "Electrical Engineering",
            Purpose = "Laboratories and prototyping",
            Floors = 4,
            X = -10,
            Z = 6,
            Occupancy = 74,
            Capacity = 200,
            WifiHealth = "Online",
            EnergyScore = 88,
            CurrentLecture = "Power Electronics",
            NextLecture = "Robotics Lab",
            AcStatus = "On",
            ProjectorStatus = "On",
            Availability = "Occupied",
        };

        var blockE = new CampusBuilding
        {
            Name = "Student Center",
            Block = "Block E",
            Department = "Student Affairs",
            Purpose = "Canteen, events, support",
            Floors = 2,
            X = 0,
            Z = 6,
            Occupancy = 91,
            Capacity = 260,
            WifiHealth = "Online",
            EnergyScore = 67,
            CurrentLecture = "Canteen Peak Hour",
            NextLecture = "Student Meetup",
            AcStatus = "On",
            ProjectorStatus = "Off",
            Availability = "Reserved",
        };

        var blockF = new CampusBuilding
        {
            Name = "Hostel & Wellness",
            Block = "Block F",
            Department = "Student Housing",
            Purpose = "Residential and wellness spaces",
            Floors = 6,
            X = 18,
            Z = 6,
            Occupancy = 83,
            Capacity = 320,
            WifiHealth = "Weak Signal",
            EnergyScore = 93,
            CurrentLecture = "Quiet Hours",
            NextLecture = "Wellness Check",
            AcStatus = "On",
            ProjectorStatus = "Off",
            Availability = "Occupied",
        };

        _db.CampusBuildings.AddRange(blockA, blockB, blockC, blockD, blockE, blockF);
        _db.WifiAccessPoints.AddRange(
            new WifiAccessPoint
            {
                CampusBuilding = blockA,
                Name = "AP-A1",
                Status = "Online",
                ConnectedUsers = 118,
                BandwidthMbps = 620,
                LatencyMs = 18,
                PacketLossPercent = 0.2,
            },
            new WifiAccessPoint
            {
                CampusBuilding = blockC,
                Name = "AP-C1",
                Status = "Weak Signal",
                ConnectedUsers = 162,
                BandwidthMbps = 240,
                LatencyMs = 44,
                PacketLossPercent = 1.7,
            },
            new WifiAccessPoint
            {
                CampusBuilding = blockF,
                Name = "AP-F1",
                Status = "Weak Signal",
                ConnectedUsers = 202,
                BandwidthMbps = 180,
                LatencyMs = 58,
                PacketLossPercent = 2.4,
            }
        );

        _db.EnergySnapshots.AddRange(
            new EnergySnapshot { CampusBuilding = blockA, ElectricityKwh = 1296, WaterLiters = 2040, SolarKwh = 54, CarbonKg = 295 },
            new EnergySnapshot { CampusBuilding = blockB, ElectricityKwh = 1044, WaterLiters = 1470, SolarKwh = 54, CarbonKg = 238 },
            new EnergySnapshot { CampusBuilding = blockC, ElectricityKwh = 1152, WaterLiters = 2580, SolarKwh = 54, CarbonKg = 263 },
            new EnergySnapshot { CampusBuilding = blockD, ElectricityKwh = 1584, WaterLiters = 2220, SolarKwh = 110, CarbonKg = 362 },
            new EnergySnapshot { CampusBuilding = blockE, ElectricityKwh = 1206, WaterLiters = 2730, SolarKwh = 72, CarbonKg = 276 },
            new EnergySnapshot { CampusBuilding = blockF, ElectricityKwh = 1674, WaterLiters = 2490, SolarKwh = 54, CarbonKg = 384 }
        );

        _db.Complaints.AddRange(
            new Complaint
            {
                TicketNo = "CMP-2026-0001",
                Student = student,
                StudentName = student.DisplayName,
                RollNumber = student.RollNumber,
                Contact = student.Email,
                Title = "Flickering lights in A-101",
                Description = "Lights dim intermittently during afternoon sessions.",
                Category = "Electrical",
                Priority = "High",
                CampusBuilding = blockA,
                RoomNumber = "A-101",
                Latitude = 28.545,
                Longitude = 77.173,
                Status = "Assigned",
                AssignedDepartment = "Electrical Maintenance",
                Technician = "Ravi Kumar",
                EstimatedCompletion = "Today 16:30",
                Images = ["panel-light.jpg", "ceiling-wiring.jpg"],
            },
            new Complaint
            {
                TicketNo = "CMP-2026-0002",
                Student = student,
                StudentName = student.DisplayName,
                RollNumber = student.RollNumber,
                Contact = student.Email,
                Title = "Water leak near hostel wash area",
                Description = "Persistent water leak creating a slippery floor.",
                Category = "Water",
                Priority = "Critical",
                CampusBuilding = blockF,
                RoomNumber = "F-012",
                Latitude = 28.546,
                Longitude = 77.175,
                Status = "In Progress",
                AssignedDepartment = "Civil Services",
                Technician = "Asha Devi",
                EstimatedCompletion = "Today 18:00",
                Images = ["leak-floor.jpg"],
            },
            new Complaint
            {
                TicketNo = "CMP-2026-0003",
                Student = student,
                StudentName = student.DisplayName,
                RollNumber = student.RollNumber,
                Contact = student.Email,
                Title = "Wi-Fi drops in library east wing",
                Description = "Students report weak and unstable signal in reading zones.",
                Category = "Internet",
                Priority = "Medium",
                CampusBuilding = blockC,
                RoomNumber = "C-Study-02",
                Latitude = 28.5457,
                Longitude = 77.1775,
                Status = "Open",
                AssignedDepartment = "IT Services",
                Technician = "Pending assignment",
                EstimatedCompletion = "Within 8 hours",
                Images = ["wifi-signal.png"],
            }
        );

        await _db.SaveChangesAsync();
    }

    private string GetSeedPassword()
    {
        var password = _configuration["SeedUsers:DefaultPassword"];
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException("SeedUsers:DefaultPassword must be configured.");
        }

        return password;
    }
}
