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
[Route("api/enrollments")]
public class EnrollmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public EnrollmentsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<List<EnrollmentDto>>> List(CancellationToken cancellationToken)
    {
        var enrollments = await _db.Enrollments
            .IncludeEnrollment()
            .OrderBy(e => e.WorkDayId)
            .ThenBy(e => e.ActivityId)
            .ToListAsync(cancellationToken);

        var viewerId = User.GetUserId();
        return enrollments.Select(e => DtoMapper.ToEnrollment(e, viewerId, true)).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<EnrollmentDto>> Create(CreateEnrollmentRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var workDay = await _db.WorkDays.FirstOrDefaultAsync(w => w.Id == request.WorkDayId, cancellationToken);
        if (workDay is null)
        {
            return BadRequest(new { message = "Werkdag bestaat niet." });
        }

        if (request.ActivityId is int activityId)
        {
            var activity = await _db.Activities.FirstOrDefaultAsync(a => a.Id == activityId, cancellationToken);
            if (activity is null)
            {
                return BadRequest(new { message = "Activiteit bestaat niet." });
            }

            if (activity.WorkDayId != request.WorkDayId)
            {
                return BadRequest(new { message = "Deze activiteit hoort niet bij de gekozen werkdag." });
            }

            if (await _db.Enrollments.AnyAsync(e => e.UserId == userId && e.ActivityId == activityId, cancellationToken))
            {
                return Conflict(new { message = "Je staat al ingeschreven voor deze taak." });
            }
        }
        else if (await _db.Enrollments.AnyAsync(e => e.UserId == userId && e.WorkDayId == request.WorkDayId && e.ActivityId == null, cancellationToken))
        {
            return Conflict(new { message = "Je hebt je deze dag al algemeen beschikbaar gesteld." });
        }

        var enrollment = new Enrollment
        {
            UserId = userId,
            WorkDayId = request.WorkDayId,
            ActivityId = request.ActivityId,
            BringsVehicle = request.BringsVehicle,
            BringsTools = request.BringsTools,
            SpecificSkills = EmptyToNull(request.SpecificSkills),
            Remarks = EmptyToNull(request.Remarks)
        };

        _db.Enrollments.Add(enrollment);
        await _db.SaveChangesAsync(cancellationToken);

        enrollment = await _db.Enrollments.IncludeEnrollment().FirstAsync(e => e.Id == enrollment.Id, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = enrollment.Id }, DtoMapper.ToEnrollment(enrollment, userId, User.IsAdmin()));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EnrollmentDto>> Get(int id, CancellationToken cancellationToken)
    {
        var enrollment = await _db.Enrollments.IncludeEnrollment().FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (enrollment is null)
        {
            return NotFound(new { message = "Inschrijving niet gevonden." });
        }

        var userId = User.GetUserId();
        var isAdmin = User.IsAdmin();
        if (!isAdmin && enrollment.UserId != userId)
        {
            return Forbid();
        }

        return DtoMapper.ToEnrollment(enrollment, userId, isAdmin);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<EnrollmentDto>> Update(int id, UpdateEnrollmentRequest request, CancellationToken cancellationToken)
    {
        var enrollment = await _db.Enrollments.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (enrollment is null)
        {
            return NotFound(new { message = "Inschrijving niet gevonden." });
        }

        var userId = User.GetUserId();
        var isAdmin = User.IsAdmin();
        if (!isAdmin && enrollment.UserId != userId)
        {
            return Forbid();
        }

        if (request.ActivityId is int activityId)
        {
            var activity = await _db.Activities.FirstOrDefaultAsync(a => a.Id == activityId, cancellationToken);
            if (activity is null)
            {
                return BadRequest(new { message = "Activiteit bestaat niet." });
            }

            if (activity.WorkDayId != enrollment.WorkDayId)
            {
                return BadRequest(new { message = "Deze activiteit hoort niet bij de werkdag van de inschrijving." });
            }

            var duplicate = await _db.Enrollments.AnyAsync(
                e => e.UserId == enrollment.UserId && e.ActivityId == activityId && e.Id != id,
                cancellationToken);
            if (duplicate)
            {
                return Conflict(new { message = "Je staat al ingeschreven voor deze taak." });
            }
        }
        else
        {
            var duplicateGeneral = await _db.Enrollments.AnyAsync(
                e => e.UserId == enrollment.UserId
                    && e.WorkDayId == enrollment.WorkDayId
                    && e.ActivityId == null
                    && e.Id != id,
                cancellationToken);
            if (duplicateGeneral)
            {
                return Conflict(new { message = "Je hebt je deze dag al algemeen beschikbaar gesteld." });
            }
        }

        enrollment.ActivityId = request.ActivityId;
        enrollment.BringsVehicle = request.BringsVehicle;
        enrollment.BringsTools = request.BringsTools;
        enrollment.SpecificSkills = EmptyToNull(request.SpecificSkills);
        enrollment.Remarks = EmptyToNull(request.Remarks);
        await _db.SaveChangesAsync(cancellationToken);

        enrollment = await _db.Enrollments.IncludeEnrollment().FirstAsync(e => e.Id == id, cancellationToken);
        return DtoMapper.ToEnrollment(enrollment, userId, isAdmin);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var enrollment = await _db.Enrollments.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (enrollment is null)
        {
            return NotFound(new { message = "Inschrijving niet gevonden." });
        }

        if (!User.IsAdmin() && enrollment.UserId != User.GetUserId())
        {
            return Forbid();
        }

        _db.Enrollments.Remove(enrollment);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static string? EmptyToNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
