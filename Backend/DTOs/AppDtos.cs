namespace Backend.DTOs
{
    public class EnrollmentDto
    {
        public Guid Id { get; set; }
        public Guid? ActivityId { get; set; }
        public Guid WorkDayId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        
        // Nullable velden: deze worden in de controller NULL gelaten voor 'gewone' vrijwilligers die andermans data bekijken
        public string? LastName { get; set; } 
        public bool? BringsVehicle { get; set; }
        public bool? BringsTools { get; set; }
        public string? SelectedTools { get; set; }
        public string? SpecificSkills { get; set; }
        public string? Remarks { get; set; }
    }

    public record ActivityDto(Guid Id, string Title, string Description, int RequiredVolunteers, string MaterialsNeeded, bool IsCompleted);
    public record WorkDayDto(Guid Id, DateTime Date, List<ActivityDto> Activities, List<EnrollmentDto> Enrollments);
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

public record CreateWorkDayDto(DateTime Date);

public record CreateActivityDto(
    Guid WorkDayId, 
    string Title, 
    string Description, 
    int RequiredVolunteers, 
    string MaterialsNeeded
);