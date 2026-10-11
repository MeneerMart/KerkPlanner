using KerkPlanner.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace KerkPlanner.Api.Data;

public static class ScheduleQueryExtensions
{
    public static IQueryable<WorkDay> IncludeSchedule(this IQueryable<WorkDay> query) =>
        query
            .Include(w => w.Coordinator)
            .Include(w => w.Opener)
            .Include(w => w.Closer)
            .Include(w => w.Activities)
                .ThenInclude(a => a.Enrollments)
                .ThenInclude(e => e.User)
            .Include(w => w.Enrollments)
                .ThenInclude(e => e.User);

    public static IQueryable<Activity> IncludeActivity(this IQueryable<Activity> query) =>
        query
            .Include(a => a.Enrollments)
                .ThenInclude(e => e.User);

    public static IQueryable<Enrollment> IncludeEnrollment(this IQueryable<Enrollment> query) =>
        query
            .Include(e => e.User)
            .Include(e => e.Activity);
}
