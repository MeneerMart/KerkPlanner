using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class WorkDay
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public DateTime Date { get; set; }

        // Vrije tekst, zodat ook iemand zonder account verantwoordelijke kan zijn.
        [MaxLength(100)]
        public string CoordinatorName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string OpenerName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string CloserName { get; set; } = string.Empty;

        // Tijdstippen als "HH:mm"; leeg als die nog niet bekend zijn.
        [MaxLength(5)]
        public string OpenTime { get; set; } = string.Empty;

        [MaxLength(5)]
        public string CloseTime { get; set; } = string.Empty;

        public ICollection<Activity> Activities { get; set; } = new List<Activity>();
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}
