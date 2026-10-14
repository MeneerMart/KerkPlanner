using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Activity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public Guid WorkDayId { get; set; }
        public WorkDay? WorkDay { get; set; }
        
        [Required, MaxLength(100)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        // 0 betekent 'geen limiet': iedereen kan zich aanmelden.
        public int RequiredVolunteers { get; set; }

        // Tijdstip als "HH:mm"; beide null betekent dat de taak de hele dag loopt.
        [MaxLength(5)]
        public string? StartTime { get; set; }

        [MaxLength(5)]
        public string? EndTime { get; set; }
        
        public string MaterialsNeeded { get; set; } = string.Empty;

        [MaxLength(500)]
        public string SafetyInstructions { get; set; } = string.Empty;

        // Geschatte tijdsduur in minuten; null als die niet bekend is.
        public int? EstimatedDurationMinutes { get; set; }
        
        public bool IsCompleted { get; set; } = false;

        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}
