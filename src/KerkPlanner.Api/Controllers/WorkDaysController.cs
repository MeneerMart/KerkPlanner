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
[Route("api/workdays")]
public class WorkDaysController : ControllerBase
{
    private readonly AppDbContext _db;

    public WorkDaysController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<WorkDayDto>>> List(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken)
    {
        var query = _db.WorkDays.AsQueryable();
        if (from is not null)
        {
            query = query.Where(w => w.Date >= from);
        }

        if (to is not null)
        {
            query = query.Where(w => w.Date <= to);
        }

        var workDays = await query
            .IncludeSchedule()
            .OrderBy(w => w.Date)
            .ToListAsync(cancellationToken);

        var viewerId = User.GetUserId();
        var isAdmin = User.IsAdmin();
        return workDays.Select(w => DtoMapper.ToWorkDay(w, viewerId, isAdmin)).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<WorkDayDto>> Get(int id, CancellationToken cancellationToken)
    {
        var workDay = await _db.WorkDays.IncludeSchedule().FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
        if (workDay is null)
        {
            return NotFound(new { message = "Werkdag niet gevonden." });
        }

        return DtoMapper.ToWorkDay(workDay, User.GetUserId(), User.IsAdmin());
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<WorkDayDto>> Create(CreateWorkDayRequest request, CancellationToken cancellationToken)
    {
        if (await _db.WorkDays.AnyAsync(w => w.Date == request.Date, cancellationToken))
        {
            return Conflict(new { message = "Er bestaat al een werkdag op deze datum." });
        }

        var error = await ValidateRoleUsersAsync(request.CoordinatorId, request.OpenerId, request.CloserId, cancellationToken);
        if (error is not null)
        {
            return error;
        }

        var workDay = new WorkDay
        {
            Date = request.Date,
            CoordinatorId = request.CoordinatorId,
            OpenerId = request.OpenerId,
            CloserId = request.CloserId
        };

        _db.WorkDays.Add(workDay);
        await _db.SaveChangesAsync(cancellationToken);

        workDay = await _db.WorkDays.IncludeSchedule().FirstAsync(w => w.Id == workDay.Id, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = workDay.Id }, DtoMapper.ToWorkDay(workDay, User.GetUserId(), true));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<WorkDayDto>> Update(int id, UpdateWorkDayRequest request, CancellationToken cancellationToken)
    {
        var workDay = await _db.WorkDays.FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
        if (workDay is null)
        {
            return NotFound(new { message = "Werkdag niet gevonden." });
        }

        if (await _db.WorkDays.AnyAsync(w => w.Date == request.Date && w.Id != id, cancellationToken))
        {
            return Conflict(new { message = "Er bestaat al een werkdag op deze datum." });
        }

        var error = await ValidateRoleUsersAsync(request.CoordinatorId, request.OpenerId, request.CloserId, cancellationToken);
        if (error is not null)
        {
            return error;
        }

        workDay.Date = request.Date;
        workDay.CoordinatorId = request.CoordinatorId;
        workDay.OpenerId = request.OpenerId;
        workDay.CloserId = request.CloserId;
        await _db.SaveChangesAsync(cancellationToken);

        workDay = await _db.WorkDays.IncludeSchedule().FirstAsync(w => w.Id == id, cancellationToken);
        return DtoMapper.ToWorkDay(workDay, User.GetUserId(), true);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var workDay = await _db.WorkDays.FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
        if (workDay is null)
        {
            return NotFound(new { message = "Werkdag niet gevonden." });
        }

        var enrollments = await _db.Enrollments.Where(e => e.WorkDayId == id).ToListAsync(cancellationToken);
        _db.Enrollments.RemoveRange(enrollments);
        _db.WorkDays.Remove(workDay);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<ActionResult?> ValidateRoleUsersAsync(
        int? coordinatorId,
        int? openerId,
        int? closerId,
        CancellationToken cancellationToken)
    {
        foreach (var userId in new[] { coordinatorId, openerId, closerId }.Where(id => id.HasValue).Select(id => id!.Value).Distinct())
        {
            if (!await _db.Users.AnyAsync(u => u.Id == userId, cancellationToken))
            {
                return BadRequest(new { message = $"Gebruiker {userId} bestaat niet." });
            }
        }

        return null;
    }
}
