using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers
{
    [Route("api/planning")]
    [ApiController]
    public class WorkDaysController : ControllerBase
    {
        private const int MaxNameLength = 100;
        private readonly AppDbContext _context;

        public WorkDaysController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WorkDayDto>>> GetPlanning()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentUserId = Guid.TryParse(userIdString, out var parsedUserId) ? parsedUserId : Guid.Empty;
            var isAdmin = User.IsInRole("Admin");

            var workDays = await _context.WorkDays
                .Include(w => w.Activities)
                .Include(w => w.Enrollments).ThenInclude(e => e.User)
                .OrderBy(w => w.Date)
                .ToListAsync();

            // Verberg verlopen dagen direct; de hosted service ruimt ze ook fysiek op.
            workDays = workDays.Where(w => w.Date.Date >= DateTime.Today).ToList();

            var result = workDays.Select(w => new WorkDayDto(
                w.Id,
                w.Date,
                w.CoordinatorName,
                w.OpenerName,
                w.CloserName,
                w.Activities.Select(a => new ActivityDto(
                    a.Id, a.Title, a.Description, a.RequiredVolunteers, a.MaterialsNeeded, a.SafetyInstructions,
                    a.EstimatedDurationMinutes, a.IsCompleted,
                    ToolTotals.Calculate(w.Enrollments.Where(e => e.ActivityId == a.Id)))).ToList(),
                w.Enrollments.Select(e => ToDto(e, isAdmin || e.UserId == currentUserId, isAdmin)).ToList()
            )).ToList();

            return Ok(result);
        }

        private static EnrollmentDto ToDto(Enrollment e, bool canSeeDetails, bool isAdmin) => new()
        {
            Id = e.Id,
            UserId = canSeeDetails ? e.UserId : null,
            ActivityId = e.ActivityId,
            WorkDayId = e.WorkDayId,
            FirstName = e.User?.FirstName ?? e.FirstName,
            TimeSlot = e.TimeSlot,
            LastName = canSeeDetails ? (e.User?.LastName ?? e.LastName) : null,
            PhoneNumber = isAdmin ? (e.User?.PhoneNumber ?? e.PhoneNumber) : null,
            BringsVehicle = canSeeDetails ? e.BringsVehicle : null,
            BringsTools = canSeeDetails ? e.BringsTools : null,
            SelectedTools = canSeeDetails ? e.SelectedTools : null,
            SpecificSkills = canSeeDetails ? e.SpecificSkills : null,
            Remarks = canSeeDetails ? e.Remarks : null
        };

        [Authorize(Roles = "Admin")]
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<UserOptionDto>>> GetUsers()
        {
            var users = await _context.Users
                .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
                .Select(u => new UserOptionDto(u.Id, u.FirstName, u.LastName, u.Email, u.PhoneNumber))
                .ToListAsync();
            return Ok(users);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("workday")]
        public async Task<IActionResult> CreateWorkDay(CreateWorkDayDto dto)
        {
            var dateToSave = new DateTime(dto.Date.Year, dto.Date.Month, dto.Date.Day);
            var existingDays = await _context.WorkDays.ToListAsync();
            if (existingDays.Any(w => w.Date.Date == dateToSave.Date))
                return BadRequest("Er is al een werkdag ingepland op deze datum.");
            if (dateToSave.Date < DateTime.Today)
                return BadRequest("Je kunt geen werkdag in het verleden inplannen.");

            var workDay = new WorkDay { Date = dateToSave };
            _context.WorkDays.Add(workDay);
            await _context.SaveChangesAsync();
            return Ok(workDay.Id);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("workday/{id:guid}/responsibles")]
        public async Task<IActionResult> UpdateResponsibles(Guid id, UpdateWorkDayResponsiblesDto dto)
        {
            var workDay = await _context.WorkDays.FindAsync(id);
            if (workDay == null) return NotFound("Werkdag niet gevonden.");

            var coordinator = dto.CoordinatorName?.Trim() ?? string.Empty;
            var opener = dto.OpenerName?.Trim() ?? string.Empty;
            var closer = dto.CloserName?.Trim() ?? string.Empty;
            if (coordinator.Length > MaxNameLength || opener.Length > MaxNameLength || closer.Length > MaxNameLength)
                return BadRequest($"Namen mogen maximaal {MaxNameLength} tekens bevatten.");

            workDay.CoordinatorName = coordinator;
            workDay.OpenerName = opener;
            workDay.CloserName = closer;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("workday/{id:guid}")]
        public async Task<IActionResult> DeleteWorkDay(Guid id)
        {
            var workDay = await _context.WorkDays.FirstOrDefaultAsync(w => w.Id == id);
            if (workDay == null) return NotFound();
            var enrollments = await _context.Enrollments.Where(e => e.WorkDayId == id).ToListAsync();
            var activities = await _context.Activities.Where(a => a.WorkDayId == id).ToListAsync();
            _context.Enrollments.RemoveRange(enrollments);
            _context.Activities.RemoveRange(activities);
            _context.WorkDays.Remove(workDay);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
