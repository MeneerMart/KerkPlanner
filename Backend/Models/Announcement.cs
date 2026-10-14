using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    /// <summary>De centrale mededeling bovenaan de planning. Er is altijd hooguit één rij (Id = 1).</summary>
    public class Announcement
    {
        public const int SingletonId = 1;

        public int Id { get; set; } = SingletonId;

        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Message { get; set; } = string.Empty;
    }
}
