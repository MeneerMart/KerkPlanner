namespace KerkPlanner.Api.Domain;

public class Activity
{
    public int Id { get; set; }
    public int WorkDayId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int RequiredVolunteers { get; set; }
    public string? MaterialsNeeded { get; set; }
    public string? SafetyInstructions { get; set; }
    public ActivityStatus Status { get; set; } = ActivityStatus.Open;

    public WorkDay WorkDay { get; set; } = null!;
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}
