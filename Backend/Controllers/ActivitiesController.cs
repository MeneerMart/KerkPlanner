using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers
{
    [Route("api/planning/activity")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class ActivitiesController : ControllerBase
    {
        private const int MaxSafetyInstructionsLength = 500;
        private const int MaxDurationMinutes = 24 * 60;
        private readonly AppDbContext _context;

        public ActivitiesController(AppDbContext context) => _context = context;

        [HttpPost]
        public async Task<IActionResult> CreateActivity(CreateActivityDto dto)
        {
            if (!await _context.WorkDays.AnyAsync(w => w.Id == dto.WorkDayId)) return NotFound("Werkdag niet gevonden.");
            var validation = Validate(dto);
            if (validation != null) return validation;

            var activity = new Activity { WorkDayId = dto.WorkDayId };
            Apply(activity, dto);
            _context.Activities.Add(activity);
            await _context.SaveChangesAsync();
            return Ok(activity.Id);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateActivity(Guid id, CreateActivityDto dto)
        {
            var activity = await _context.Activities.FindAsync(id);
            if (activity == null) return NotFound();
            var validation = Validate(dto);
            if (validation != null) return validation;

            Apply(activity, dto);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id:guid}/completed")]
        public async Task<IActionResult> SetCompleted(Guid id, SetActivityCompletedDto dto)
        {
            var activity = await _context.Activities.FindAsync(id);
            if (activity == null) return NotFound();
            activity.IsCompleted = dto.IsCompleted;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteActivity(Guid id)
        {
            var activity = await _context.Activities.FirstOrDefaultAsync(a => a.Id == id);
            if (activity == null) return NotFound();
            var enrollments = await _context.Enrollments.Where(e => e.ActivityId == id).ToListAsync();
            _context.Enrollments.RemoveRange(enrollments);
            _context.Activities.Remove(activity);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private BadRequestObjectResult? Validate(CreateActivityDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest("Een taaknaam is verplicht.");
            if (dto.RequiredVolunteers < 0) return BadRequest("Het aantal vrijwilligers kan niet negatief zijn.");
            if (!TimeOfDay.TryNormalize(dto.StartTime, out var start) || !TimeOfDay.TryNormalize(dto.EndTime, out var end))
                return BadRequest("Vul een geldige tijd in (uu:mm).");
            if ((start == null) != (end == null))
                return BadRequest("Vul zowel een begin- als eindtijd in, of kies 'hele dag'.");
            if (start != null && string.CompareOrdinal(start, end) >= 0)
                return BadRequest("De eindtijd moet na de begintijd liggen.");
            if (dto.SafetyInstructions?.Trim().Length > MaxSafetyInstructionsLength)
                return BadRequest($"De veiligheidsinstructies mogen maximaal {MaxSafetyInstructionsLength} tekens bevatten.");
            if (dto.EstimatedDurationMinutes is < 1 or > MaxDurationMinutes)
                return BadRequest("De geschatte tijdsduur moet tussen 1 minuut en 24 uur liggen.");
            return null;
        }

        private static void Apply(Activity activity, CreateActivityDto dto)
        {
            activity.Title = dto.Title.Trim();
            activity.Description = dto.Description ?? "";
            activity.RequiredVolunteers = dto.RequiredVolunteers;
            TimeOfDay.TryNormalize(dto.StartTime, out var start);
            TimeOfDay.TryNormalize(dto.EndTime, out var end);
            activity.StartTime = start;
            activity.EndTime = end;
            activity.MaterialsNeeded = dto.MaterialsNeeded ?? "[]";
            activity.SafetyInstructions = dto.SafetyInstructions?.Trim() ?? "";
            activity.EstimatedDurationMinutes = dto.EstimatedDurationMinutes;
        }
    }
}
