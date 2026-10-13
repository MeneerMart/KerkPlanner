using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Enrollment
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // Null voor een inschrijving die door een beheerder voor een persoon zonder account is aangemaakt.
        public Guid? UserId { get; set; }
        public User? User { get; set; }

        // Gastgegevens worden alleen gebruikt als UserId null is.
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        public Guid WorkDayId { get; set; }
        public WorkDay? WorkDay { get; set; }

        // Nullable: als dit null is, is de persoon 'algemeen beschikbaar' op de WorkDay.
        public Guid? ActivityId { get; set; }
        public Activity? Activity { get; set; }

        // Hele dag, ochtend, middag of avond (zie TimeSlots).
        [MaxLength(20)]
        public string TimeSlot { get; set; } = TimeSlots.FullDay;

        public bool BringsVehicle { get; set; }
        public bool BringsTools { get; set; }
        public string SelectedTools { get; set; } = string.Empty;

        [MaxLength(250)]
        public string SpecificSkills { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Remarks { get; set; } = string.Empty;
    }
}
