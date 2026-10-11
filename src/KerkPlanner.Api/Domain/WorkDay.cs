namespace KerkPlanner.Api.Domain;

public class WorkDay
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public int? CoordinatorId { get; set; }
    public int? OpenerId { get; set; }
    public int? CloserId { get; set; }

    public User? Coordinator { get; set; }
    public User? Opener { get; set; }
    public User? Closer { get; set; }
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}
