namespace Backend.DTOs
{
    public class EnrollmentDto
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public Guid? ActivityId { get; set; }
        public Guid WorkDayId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string TimeSlot { get; set; } = string.Empty;
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public bool? BringsVehicle { get; set; }
        public bool? BringsTools { get; set; }
        // JSON object, e.g. {"Hamer":2,"Schroevendraaier":1}
        public string? SelectedTools { get; set; }
        public string? SpecificSkills { get; set; }
        public string? Remarks { get; set; }
    }

    public record ActivityDto(Guid Id, string Title, string Description, int RequiredVolunteers, string? StartTime, string? EndTime, string MaterialsNeeded, string SafetyInstructions, int? EstimatedDurationMinutes, bool IsCompleted, string ToolsProvided);
    public record WorkDayDto(Guid Id, DateTime Date, string CoordinatorName, string OpenerName, string OpenTime, string CloserName, string CloseTime, List<ActivityDto> Activities, List<EnrollmentDto> Enrollments);
    public record UserOptionDto(Guid Id, string FirstName, string LastName, string Email, string? PhoneNumber);
}

public record CreateEnrollmentDto(
    Guid WorkDayId,
    Guid? ActivityId,
    string? TimeSlot,
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
    string? TimeSlot,
    bool BringsVehicle,
    string? SelectedTools,
    string? SpecificSkills,
    string? Remarks
);

public record CreateWorkDayDto(DateTime Date);

public record UpdateWorkDayResponsiblesDto(
    string? CoordinatorName,
    string? OpenerName,
    string? OpenTime,
    string? CloserName,
    string? CloseTime
);

public record CreateActivityDto(
    Guid WorkDayId,
    string Title,
    string Description,
    int RequiredVolunteers,
    string? StartTime,
    string? EndTime,
    string MaterialsNeeded,
    string? SafetyInstructions,
    int? EstimatedDurationMinutes
);

public record SetActivityCompletedDto(bool IsCompleted);

public record AdminCreateGuestEnrollmentDto(
    Guid WorkDayId,
    Guid? ActivityId,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string? TimeSlot,
    bool BringsVehicle,
    string? SelectedTools,
    string? SpecificSkills,
    string? Remarks
);

public record AnnouncementDto(string Title, string Message);
