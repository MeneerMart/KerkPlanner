using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<WorkDay> WorkDays { get; set; }
        public DbSet<Activity> Activities { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Announcement> Announcements { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Vaste Id; de database moet hem niet zelf ophogen.
            modelBuilder.Entity<Announcement>().Property(a => a.Id).ValueGeneratedNever();

            // Een inschrijving kan bij een account horen, maar ook een handmatig toegevoegde gast zijn.
            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.User)
                .WithMany(u => u.Enrollments)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Voorkom cascade conflicten bij Enrollments
            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.WorkDay)
                .WithMany(w => w.Enrollments)
                .HasForeignKey(e => e.WorkDayId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Activity)
                .WithMany(a => a.Enrollments)
                .HasForeignKey(e => e.ActivityId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}