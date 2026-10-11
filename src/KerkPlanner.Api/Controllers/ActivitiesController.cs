using KerkPlanner.Api.Data;
using KerkPlanner.Api.Domain;
using KerkPlanner.Api.Dtos;
using KerkPlanner.Api.Infrastructure;
using KerkPlanner.Api.Mapping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KerkPlanner.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/activities")]
public class ActivitiesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ActivitiesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ActivityDto>> Get(int id, CancellationToken cancellationToken)
    {
        var activity = await _db.Activities.IncludeActivity().FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (activity is null)
        {
            return NotFound(new { message = "Activiteit niet gevonden." });
        }

        return DtoMapper.ToActivity(activity, User.GetUserId(), User.IsAdmin());
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<ActivityDto>> Create(CreateActivityRequest request, CancellationToken cancellationToken)
    {
        if (!await _db.WorkDays.AnyAsync(w => w.Id == request.WorkDayId, cancellationToken))
        {
            return BadRequest(new { message = "Werkdag bestaat niet." });
        }

        var activity = new Activity
        {
            WorkDayId = request.WorkDayId,
            Title = request.Title.Trim(),
            Description = EmptyToNull(request.Description),
            RequiredVolunteers = request.RequiredVolunteers,
            MaterialsNeeded = EmptyToNull(request.MaterialsNeeded),
            SafetyInstructions = EmptyToNull(request.SafetyInstructions),
            Status = ActivityStatus.Open
        };

        _db.Activities.Add(activity);
        await _db.SaveChangesAsync(cancellationToken);

        activity = await _db.Activities.IncludeActivity().FirstAsync(a => a.Id == activity.Id, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = activity.Id }, DtoMapper.ToActivity(activity, User.GetUserId(), true));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<ActivityDto>> Update(int id, UpdateActivityRequest request, CancellationToken cancellationToken)
    {
        var activity = await _db.Activities.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (activity is null)
        {
            return NotFound(new { message = "Activiteit niet gevonden." });
        }

        activity.Title = request.Title.Trim();
        activity.Description = EmptyToNull(request.Description);
        activity.RequiredVolunteers = request.RequiredVolunteers;
        activity.MaterialsNeeded = EmptyToNull(request.MaterialsNeeded);
        activity.SafetyInstructions = EmptyToNull(request.SafetyInstructions);
        activity.Status = request.Status;
        await _db.SaveChangesAsync(cancellationToken);

        activity = await _db.Activities.IncludeActivity().FirstAsync(a => a.Id == id, cancellationToken);
        return DtoMapper.ToActivity(activity, User.GetUserId(), true);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var activity = await _db.Activities.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (activity is null)
        {
            return NotFound(new { message = "Activiteit niet gevonden." });
        }

        var enrollments = await _db.Enrollments.Where(e => e.ActivityId == id).ToListAsync(cancellationToken);
        _db.Enrollments.RemoveRange(enrollments);
        _db.Activities.Remove(activity);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static string? EmptyToNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
