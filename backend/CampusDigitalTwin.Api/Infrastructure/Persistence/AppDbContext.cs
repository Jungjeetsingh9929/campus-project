using CampusDigitalTwin.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusDigitalTwin.Api.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<CampusBuilding> CampusBuildings => Set<CampusBuilding>();
    public DbSet<Classroom> Classrooms => Set<Classroom>();
    public DbSet<Complaint> Complaints => Set<Complaint>();
    public DbSet<WifiAccessPoint> WifiAccessPoints => Set<WifiAccessPoint>();
    public DbSet<EnergySnapshot> EnergySnapshots => Set<EnergySnapshot>();
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<ComplaintUpdate> ComplaintUpdates => Set<ComplaintUpdate>();
    public DbSet<EmergencyEvent> EmergencyEvents => Set<EmergencyEvent>();
    public DbSet<AuditRecord> AuditRecords => Set<AuditRecord>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<StoredFile> StoredFiles => Set<StoredFile>();
    public DbSet<NotificationRecord> Notifications => Set<NotificationRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasSequence<long>("complaint_ticket_sequence")
            .StartsAt(1)
            .IncrementsBy(1);

        modelBuilder.Entity<CampusBuilding>()
            .HasMany(item => item.Classrooms)
            .WithOne(item => item.CampusBuilding)
            .HasForeignKey(item => item.CampusBuildingId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserAccount>()
            .HasIndex(item => item.Email)
            .IsUnique();

        modelBuilder.Entity<UserAccount>()
            .Property(item => item.Role)
            .HasMaxLength(32);

        modelBuilder.Entity<Complaint>()
            .HasOne(item => item.Student)
            .WithMany()
            .HasForeignKey(item => item.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Complaint>()
            .HasIndex(item => item.TicketNo)
            .IsUnique();

        modelBuilder.Entity<ComplaintUpdate>()
            .HasOne(item => item.Complaint)
            .WithMany(item => item.Updates)
            .HasForeignKey(item => item.ComplaintId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserSession>()
            .HasIndex(item => item.RefreshTokenHash)
            .IsUnique();

        modelBuilder.Entity<UserSession>()
            .HasIndex(item => new { item.UserAccountId, item.TokenFamilyId });

        modelBuilder.Entity<PasswordResetToken>()
            .HasIndex(item => item.TokenHash)
            .IsUnique();

        modelBuilder.Entity<StoredFile>()
            .HasIndex(item => item.StorageKey)
            .IsUnique();

        modelBuilder.Entity<NotificationRecord>()
            .HasIndex(item => new { item.UserAccountId, item.ReadAt });
    }
}
