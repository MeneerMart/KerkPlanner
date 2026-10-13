namespace Backend.DTOs
{
    public class EnrollmentDto
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public Guid? ActivityId { get; set; }
        public Guid WorkDayId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public bool? BringsVehicle { get; set; }
        public bool? BringsTools { get; set; }
        // JSON object, e.g. {"Hamer":2,"Schroevendraaier":1}
        public string? SelectedTools { get; set; }
        public string? SpecificSkills { get; set; }
        public string? Remarks { get; set; }
    }

    public record ActivityDto(Guid Id, string Title, string Description, int RequiredVolunteers, string MaterialsNeeded, bool IsCompleted, string ToolsProvided);
    public record WorkDayDto(Guid Id, DateTime Date, List<ActivityDto> Activities, List<EnrollmentDto> Enrollments);
    public record UserOptionDto(Guid Id, string FirstName, string LastName, string Email, string? PhoneNumber);
}

public record CreateEnrollmentDto(
    Guid WorkDayId,
    Guid? ActivityId,
    bool BringsVehicle,
    bool BringsTools,
    string? SelectedTools,
    string? SpecificSkills,
    string? Remarks
);

public record AdminCreateEnrollmentDto(
    Guid UserId,
    Guid WorkDayId,
    Guid? ActivityId,
    bool BringsVehicle,
    string? SelectedTools,
    string? SpecificSkills,
    string? Remarks
);

public record CreateWorkDayDto(DateTime Date);

public record CreateActivityDto(
    Guid WorkDayId,
    string Title,
    string Description,
    int RequiredVolunteers,
    string MaterialsNeeded
);

public record AdminCreateGuestEnrollmentDto(
    Guid WorkDayId,
    Guid? ActivityId,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    bool BringsVehicle,
    string? SelectedTools,
    string? SpecificSkills,
    string? Remarks
);
