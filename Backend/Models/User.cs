using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required, EmailAddress, MaxLength(100)]
        public string Email { get; set; } = string.Empty; // Nieuw!
        
        [Required, MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required, MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; } // Nieuw! (Optioneel)
        
        [Required]
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required, MaxLength(20)]
        public string Role { get; set; } = "Volunteer";

        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}