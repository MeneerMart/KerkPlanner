using KerkPlanner.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace KerkPlanner.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<WorkDay> WorkDays => Set<WorkDay>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(u => u.LastName).HasMaxLength(100).IsRequired();
            entity.Property(u => u.Email).HasMaxLength(256).IsRequired();
            entity.Property(u => u.Phone).HasMaxLength(30);
            entity.Property(u => u.PasswordHash).HasMaxLength(500).IsRequired();
            entity.Property(u => u.Role).HasConversion<string>().HasMaxLength(32);

            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<WorkDay>(entity =>
        {
            entity.HasIndex(w => w.Date).IsUnique();

            entity.HasOne(w => w.Coordinator)
                .WithMany(u => u.CoordinatedDays)
                .HasForeignKey(w => w.CoordinatorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(w => w.Opener)
                .WithMany(u => u.OpenedDays)
                .HasForeignKey(w => w.OpenerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(w => w.Closer)
                .WithMany(u => u.ClosedDays)
                .HasForeignKey(w => w.CloserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Activity>(entity =>
        {
            entity.Property(a => a.Title).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Description).HasMaxLength(2000);
            entity.Property(a => a.MaterialsNeeded).HasMaxLength(2000);
            entity.Property(a => a.SafetyInstructions).HasMaxLength(2000);
            entity.Property(a => a.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(a => a.RequiredVolunteers).HasDefaultValue(1);

            entity.HasOne(a => a.WorkDay)
                .WithMany(w => w.Activities)
                .HasForeignKey(a => a.WorkDayId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.Property(e => e.SpecificSkills).HasMaxLength(500);
            entity.Property(e => e.Remarks).HasMaxLength(2000);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Enrollments)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.WorkDay)
                .WithMany(w => w.Enrollments)
                .HasForeignKey(e => e.WorkDayId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Activity)
                .WithMany(a => a.Enrollments)
                .HasForeignKey(e => e.ActivityId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.UserId, e.WorkDayId })
                .IsUnique()
                .HasFilter("[ActivityId] IS NULL")
                .HasDatabaseName("IX_Enrollments_User_WorkDay_General");

            entity.HasIndex(e => new { e.UserId, e.ActivityId })
                .IsUnique()
                .HasFilter("[ActivityId] IS NOT NULL")
                .HasDatabaseName("IX_Enrollments_User_Activity");
        });
    }
}
