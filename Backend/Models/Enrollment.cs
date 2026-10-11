using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Enrollment
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }
        public User? User { get; set; }

        public Guid WorkDayId { get; set; }
        public WorkDay? WorkDay { get; set; }

        // Nullable: als dit null is, is de persoon 'algemeen beschikbaar' op de WorkDay
        public Guid? ActivityId { get; set; }
        public Activity? Activity { get; set; }

        public bool BringsVehicle { get; set; }
        public bool BringsTools { get; set; }
        public string SelectedTools { get; set; } = string.Empty; // Toegevoegd
        
        [MaxLength(250)]
        public string SpecificSkills { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Remarks { get; set; } = string.Empty;
    }
}