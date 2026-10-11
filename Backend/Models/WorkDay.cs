using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class WorkDay
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public DateTime Date { get; set; }

        public Guid? CoordinatorId { get; set; }
        public User? Coordinator { get; set; }

        public Guid? OpenerId { get; set; }
        public User? Opener { get; set; }

        public Guid? CloserId { get; set; }
        public User? Closer { get; set; }

        public ICollection<Activity> Activities { get; set; } = new List<Activity>();
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}