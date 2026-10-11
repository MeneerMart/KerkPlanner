namespace KerkPlanner.Api.Domain;

public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Volunteer;

    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<WorkDay> CoordinatedDays { get; set; } = new List<WorkDay>();
    public ICollection<WorkDay> OpenedDays { get; set; } = new List<WorkDay>();
    public ICollection<WorkDay> ClosedDays { get; set; } = new List<WorkDay>();
}
