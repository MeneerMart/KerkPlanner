using KerkPlanner.Api.Domain;
using KerkPlanner.Api.Dtos;

namespace KerkPlanner.Api.Mapping;

public static class DtoMapper
{
    public static CurrentUserDto ToCurrentUser(User user) => new()
    {
        Id = user.Id,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Email = user.Email,
        Phone = user.Phone,
        Role = user.Role.ToString()
    };

    public static UserListItemDto ToUserListItem(User user) => new()
    {
        Id = user.Id,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Email = user.Email,
        Phone = user.Phone,
        Role = user.Role.ToString()
    };

    public static WorkDayDto ToWorkDay(WorkDay workDay, int viewerId, bool viewerIsAdmin)
    {
        var activities = workDay.Activities
            .OrderBy(a => a.Id)
            .Select(a => ToActivity(a, viewerId, viewerIsAdmin))
            .ToList();

        var general = workDay.Enrollments
            .Where(e => e.ActivityId is null)
            .OrderBy(e => e.Id)
            .Select(e => ToEnrollment(e, viewerId, viewerIsAdmin))
            .ToList();

        return new WorkDayDto
        {
            Id = workDay.Id,
            Date = workDay.Date,
            Coordinator = ToPerson(workDay.Coordinator, viewerId, viewerIsAdmin, includeContact: viewerIsAdmin),
            Opener = ToPerson(workDay.Opener, viewerId, viewerIsAdmin, includeContact: viewerIsAdmin),
            Closer = ToPerson(workDay.Closer, viewerId, viewerIsAdmin, includeContact: viewerIsAdmin),
            Activities = activities,
            GeneralEnrollments = general
        };
    }

    public static ActivityDto ToActivity(Activity activity, int viewerId, bool viewerIsAdmin)
    {
        var enrollments = activity.Enrollments
            .OrderBy(e => e.Id)
            .Select(e => ToEnrollment(e, viewerId, viewerIsAdmin))
            .ToList();

        var enrolledCount = enrollments.Count;
        var required = Math.Max(activity.RequiredVolunteers, 1);

        return new ActivityDto
        {
            Id = activity.Id,
            WorkDayId = activity.WorkDayId,
            Title = activity.Title,
            Description = activity.Description,
            RequiredVolunteers = activity.RequiredVolunteers,
            EnrolledCount = enrolledCount,
            OccupancyLevel = OccupancyLevel(enrolledCount, required),
            MaterialsNeeded = activity.MaterialsNeeded,
            SafetyInstructions = activity.SafetyInstructions,
            Status = activity.Status,
            Enrollments = enrollments
        };
    }

    public static EnrollmentDto ToEnrollment(Enrollment enrollment, int viewerId, bool viewerIsAdmin)
    {
        var isOwn = enrollment.UserId == viewerId;
        var showDetails = viewerIsAdmin || isOwn;

        return new EnrollmentDto
        {
            Id = enrollment.Id,
            UserId = enrollment.UserId,
            WorkDayId = enrollment.WorkDayId,
            ActivityId = enrollment.ActivityId,
            Person = ToPerson(enrollment.User, viewerId, viewerIsAdmin, includeContact: showDetails)!,
            BringsVehicle = showDetails ? enrollment.BringsVehicle : null,
            BringsTools = showDetails ? enrollment.BringsTools : null,
            SpecificSkills = showDetails ? enrollment.SpecificSkills : null,
            Remarks = showDetails ? enrollment.Remarks : null,
            IsOwn = isOwn
        };
    }

    public static PersonDto? ToPerson(User? user, int viewerId, bool viewerIsAdmin, bool includeContact)
    {
        if (user is null)
        {
            return null;
        }

        var showIdentity = viewerIsAdmin || user.Id == viewerId;

        return new PersonDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = showIdentity ? user.LastName : null,
            Email = includeContact && showIdentity ? user.Email : null,
            Phone = includeContact && showIdentity ? user.Phone : null
        };
    }

    public static string OccupancyLevel(int enrolled, int required)
    {
        if (enrolled >= required)
        {
            return "red";
        }

        if (enrolled >= required * 0.7)
        {
            return "orange";
        }

        return "green";
    }
}
