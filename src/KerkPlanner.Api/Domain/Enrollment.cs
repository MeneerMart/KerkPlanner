namespace KerkPlanner.Api.Domain;

public class Enrollment
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? ActivityId { get; set; }
    public int WorkDayId { get; set; }
    public bool BringsVehicle { get; set; }
    public bool BringsTools { get; set; }
    public string? SpecificSkills { get; set; }
    public string? Remarks { get; set; }

    public User User { get; set; } = null!;
    public Activity? Activity { get; set; }
    public WorkDay WorkDay { get; set; } = null!;
}
