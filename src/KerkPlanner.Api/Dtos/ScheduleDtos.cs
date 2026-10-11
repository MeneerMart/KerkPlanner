using System.ComponentModel.DataAnnotations;
using KerkPlanner.Api.Domain;

namespace KerkPlanner.Api.Dtos;

public class PersonDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
}

public class EnrollmentDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int WorkDayId { get; set; }
    public int? ActivityId { get; set; }
    public PersonDto Person { get; set; } = null!;
    public bool? BringsVehicle { get; set; }
    public bool? BringsTools { get; set; }
    public string? SpecificSkills { get; set; }
    public string? Remarks { get; set; }
    public bool IsOwn { get; set; }
}

public class ActivityDto
{
    public int Id { get; set; }
    public int WorkDayId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int RequiredVolunteers { get; set; }
    public int EnrolledCount { get; set; }
    public string OccupancyLabel => $"{EnrolledCount}/{RequiredVolunteers}";
    public string OccupancyLevel { get; set; } = "green";
    public string? MaterialsNeeded { get; set; }
    public string? SafetyInstructions { get; set; }
    public ActivityStatus Status { get; set; }
    public List<EnrollmentDto> Enrollments { get; set; } = [];
}

public class WorkDayDto
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public PersonDto? Coordinator { get; set; }
    public PersonDto? Opener { get; set; }
    public PersonDto? Closer { get; set; }
    public List<ActivityDto> Activities { get; set; } = [];
    public List<EnrollmentDto> GeneralEnrollments { get; set; } = [];
}

public class CreateWorkDayRequest
{
    [Required]
    public DateOnly Date { get; set; }
    public int? CoordinatorId { get; set; }
    public int? OpenerId { get; set; }
    public int? CloserId { get; set; }
}

public class UpdateWorkDayRequest
{
    [Required]
    public DateOnly Date { get; set; }
    public int? CoordinatorId { get; set; }
    public int? OpenerId { get; set; }
    public int? CloserId { get; set; }
}

public class CreateActivityRequest
{
    [Required]
    public int WorkDayId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(1, 200)]
    public int RequiredVolunteers { get; set; } = 1;

    [MaxLength(2000)]
    public string? MaterialsNeeded { get; set; }

    [MaxLength(2000)]
    public string? SafetyInstructions { get; set; }
}

public class UpdateActivityRequest
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(1, 200)]
    public int RequiredVolunteers { get; set; } = 1;

    [MaxLength(2000)]
    public string? MaterialsNeeded { get; set; }

    [MaxLength(2000)]
    public string? SafetyInstructions { get; set; }

    [Required]
    public ActivityStatus Status { get; set; }
}

public class CreateEnrollmentRequest
{
    [Required]
    public int WorkDayId { get; set; }

    public int? ActivityId { get; set; }
    public bool BringsVehicle { get; set; }
    public bool BringsTools { get; set; }

    [MaxLength(500)]
    public string? SpecificSkills { get; set; }

    [MaxLength(2000)]
    public string? Remarks { get; set; }
}

public class UpdateEnrollmentRequest
{
    public int? ActivityId { get; set; }
    public bool BringsVehicle { get; set; }
    public bool BringsTools { get; set; }

    [MaxLength(500)]
    public string? SpecificSkills { get; set; }

    [MaxLength(2000)]
    public string? Remarks { get; set; }
}

public class UserListItemDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
}
