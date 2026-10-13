using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlanningController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PlanningController(AppDbContext context) => _context = context;

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
                w.Activities.Select(a => new ActivityDto(a.Id, a.Title, a.Description, a.RequiredVolunteers, a.MaterialsNeeded, a.IsCompleted, GetToolsProvided(w.Enrollments.Where(e => e.ActivityId == a.Id)))).ToList(),
                w.Enrollments.Select(e =>
                {
                    var canSeeDetails = isAdmin || e.UserId == currentUserId;
                    return new EnrollmentDto
                    {
                        Id = e.Id,
                        UserId = canSeeDetails ? e.UserId : null,
                        ActivityId = e.ActivityId,
                        WorkDayId = e.WorkDayId,
                        FirstName = e.User?.FirstName ?? e.FirstName,
                        LastName = canSeeDetails ? (e.User?.LastName ?? e.LastName) : null,
                        PhoneNumber = isAdmin ? (e.User?.PhoneNumber ?? e.PhoneNumber) : null,
                        BringsVehicle = canSeeDetails ? e.BringsVehicle : null,
                        BringsTools = canSeeDetails ? e.BringsTools : null,
                        SelectedTools = canSeeDetails ? e.SelectedTools : null,
                        SpecificSkills = canSeeDetails ? e.SpecificSkills : null,
                        Remarks = canSeeDetails ? e.Remarks : null
                    };
                }).ToList()
            )).ToList();

            return Ok(result);
        }

        private static string GetToolsProvided(IEnumerable<Enrollment> enrollments)
        {
            var totals = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var enrollment in enrollments)
            {
                var raw = enrollment.SelectedTools;
                if (string.IsNullOrWhiteSpace(raw)) continue;
                try
                {
                    using var document = JsonDocument.Parse(raw);
                    if (document.RootElement.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var property in document.RootElement.EnumerateObject())
                        {
                            if (!property.Value.TryGetInt32(out var amount) || amount <= 0) continue;
                            totals[property.Name] = totals.GetValueOrDefault(property.Name) + amount;
                        }
                    }
                    else if (document.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in document.RootElement.EnumerateArray())
                        {
                            if (item.ValueKind != JsonValueKind.String) continue;
                            var name = item.GetString()?.Trim();
                            if (!string.IsNullOrWhiteSpace(name)) totals[name] = totals.GetValueOrDefault(name) + 1;
                        }
                    }
                }
                catch (JsonException)
                {
                    // Ondersteun bestaande inschrijvingen met de oude komma-gescheiden opslag.
                    foreach (var name in raw.Split(',').Select(value => value.Trim()).Where(value => value.Length > 0))
                        totals[name] = totals.GetValueOrDefault(name) + 1;
                }
            }
            return JsonSerializer.Serialize(totals);
        }

        [Authorize]
        [HttpPost("enroll")]
        public async Task<IActionResult> Enroll(CreateEnrollmentDto dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized("Niet ingelogd.");
            return await CreateEnrollmentForUser(userId, null, null, null, dto.WorkDayId, dto.ActivityId, dto.BringsVehicle, dto.SelectedTools, dto.SpecificSkills, dto.Remarks);
        }

        [Authorize]
        [HttpPut("enroll/{id:guid}")]
        public async Task<IActionResult> UpdateEnrollment(Guid id, CreateEnrollmentDto dto)
        {
            var enrollment = await _context.Enrollments.FirstOrDefaultAsync(e => e.Id == id);
            if (enrollment == null) return NotFound("Inschrijving niet gevonden.");

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();
            if (enrollment.UserId != userId && !User.IsInRole("Admin")) return Forbid();

            if (enrollment.WorkDayId != dto.WorkDayId || enrollment.ActivityId != dto.ActivityId)
            {
                var duplicate = enrollment.UserId.HasValue
                    ? await _context.Enrollments.AnyAsync(e => e.Id != id && e.UserId == enrollment.UserId && e.WorkDayId == dto.WorkDayId && e.ActivityId == dto.ActivityId)
                    : await _context.Enrollments.AnyAsync(e => e.Id != id && e.UserId == null && e.FirstName == enrollment.FirstName && e.LastName == enrollment.LastName && e.PhoneNumber == enrollment.PhoneNumber && e.WorkDayId == dto.WorkDayId && e.ActivityId == dto.ActivityId);
                if (duplicate) return BadRequest("Deze persoon is al ingeschreven voor deze taak.");
            }

            var validation = await ValidateWorkDayAndActivity(dto.WorkDayId, dto.ActivityId);
            if (validation != null) return validation;

            enrollment.WorkDayId = dto.WorkDayId;
            enrollment.ActivityId = dto.ActivityId;
            enrollment.BringsVehicle = dto.BringsVehicle;
            enrollment.BringsTools = !string.IsNullOrWhiteSpace(dto.SelectedTools) && dto.SelectedTools != "{}";
            enrollment.SelectedTools = dto.SelectedTools ?? "{}";
            enrollment.SpecificSkills = dto.SpecificSkills ?? "";
            enrollment.Remarks = dto.Remarks ?? "";
            await _context.SaveChangesAsync();
            return Ok();
        }

        [Authorize]
        [HttpDelete("enroll/{id:guid}")]
        public async Task<IActionResult> DeleteEnrollment(Guid id)
        {
            var enrollment = await _context.Enrollments.FirstOrDefaultAsync(e => e.Id == id);
            if (enrollment == null) return NotFound("Inschrijving niet gevonden.");

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();
            if (enrollment.UserId != userId && !User.IsInRole("Admin")) return Forbid();

            _context.Enrollments.Remove(enrollment);
            await _context.SaveChangesAsync();
            return NoContent();
        }

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
        [HttpPost("enroll/admin")]
        public async Task<IActionResult> AdminEnroll(AdminCreateEnrollmentDto dto)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.UserId);
            if (!userExists) return NotFound("Gebruiker niet gevonden.");
            return await CreateEnrollmentForUser(dto.UserId, null, null, null, dto.WorkDayId, dto.ActivityId, dto.BringsVehicle, dto.SelectedTools, dto.SpecificSkills, dto.Remarks);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("enroll/admin/guest")]
        public async Task<IActionResult> AdminEnrollGuest(AdminCreateGuestEnrollmentDto dto)
        {
            var firstName = dto.FirstName?.Trim() ?? string.Empty;
            var lastName = dto.LastName?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(firstName)) return BadRequest("Voornaam is verplicht.");
            if (string.IsNullOrWhiteSpace(lastName)) return BadRequest("Achternaam is verplicht.");
            if (firstName.Length > 50 || lastName.Length > 50) return BadRequest("Voor- en achternaam mogen maximaal 50 tekens bevatten.");
            if (dto.PhoneNumber?.Trim().Length > 20) return BadRequest("Het telefoonnummer mag maximaal 20 tekens bevatten.");

            return await CreateEnrollmentForUser(null, firstName, lastName, dto.PhoneNumber?.Trim(), dto.WorkDayId, dto.ActivityId, dto.BringsVehicle, dto.SelectedTools, dto.SpecificSkills, dto.Remarks);
        }

        private async Task<IActionResult> CreateEnrollmentForUser(Guid? userId, string? firstName, string? lastName, string? phoneNumber, Guid workDayId, Guid? activityId, bool bringsVehicle, string? selectedTools, string? specificSkills, string? remarks)
        {
            var validation = await ValidateWorkDayAndActivity(workDayId, activityId);
            if (validation != null) return validation;

            bool duplicate;
            if (userId.HasValue)
            {
                duplicate = await _context.Enrollments.AnyAsync(e => e.UserId == userId && e.WorkDayId == workDayId && e.ActivityId == activityId);
            }
            else
            {
                var normalizedPhone = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber;
                duplicate = await _context.Enrollments.AnyAsync(e => e.UserId == null && e.FirstName.ToLower() == firstName!.ToLower() && e.LastName.ToLower() == lastName!.ToLower() && e.PhoneNumber == normalizedPhone && e.WorkDayId == workDayId && e.ActivityId == activityId);
            }
            if (duplicate) return BadRequest("Deze persoon is al ingeschreven voor deze taak.");

            var enrollment = new Enrollment
            {
                UserId = userId,
                FirstName = userId.HasValue ? string.Empty : firstName!.Trim(),
                LastName = userId.HasValue ? string.Empty : lastName!.Trim(),
                PhoneNumber = userId.HasValue ? null : (string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim()),
                WorkDayId = workDayId,
                ActivityId = activityId,
                BringsVehicle = bringsVehicle,
                BringsTools = !string.IsNullOrWhiteSpace(selectedTools) && selectedTools != "{}",
                SelectedTools = selectedTools ?? "{}",
                SpecificSkills = specificSkills ?? "",
                Remarks = remarks ?? ""
            };

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();
            return Ok(enrollment.Id);
        }

        private async Task<IActionResult?> ValidateWorkDayAndActivity(Guid workDayId, Guid? activityId)
        {
            var workDay = await _context.WorkDays.FirstOrDefaultAsync(w => w.Id == workDayId);
            if (workDay == null) return NotFound("Werkdag niet gevonden.");
            if (workDay.Date.Date < DateTime.Today) return BadRequest("Deze werkdag is voorbij.");
            if (activityId.HasValue)
            {
                var activityMatchesDay = await _context.Activities.AnyAsync(a => a.Id == activityId.Value && a.WorkDayId == workDayId);
                if (!activityMatchesDay) return BadRequest("De gekozen taak hoort niet bij deze werkdag.");
            }
            return null;
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

        [Authorize(Roles = "Admin")]
        [HttpPost("activity")]
        public async Task<IActionResult> CreateActivity(CreateActivityDto dto)
        {
            if (!await _context.WorkDays.AnyAsync(w => w.Id == dto.WorkDayId)) return NotFound("Werkdag niet gevonden.");
            if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest("Een taaknaam is verplicht.");
            if (dto.RequiredVolunteers < 1) return BadRequest("Het aantal vrijwilligers moet minimaal 1 zijn.");

            var activity = new Activity
            {
                WorkDayId = dto.WorkDayId,
                Title = dto.Title.Trim(),
                Description = dto.Description ?? "",
                RequiredVolunteers = dto.RequiredVolunteers,
                MaterialsNeeded = dto.MaterialsNeeded ?? "[]"
            };
            _context.Activities.Add(activity);
            await _context.SaveChangesAsync();
            return Ok(activity.Id);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("activity/{id:guid}")]
        public async Task<IActionResult> UpdateActivity(Guid id, CreateActivityDto dto)
        {
            var activity = await _context.Activities.FindAsync(id);
            if (activity == null) return NotFound();
            if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest("Een taaknaam is verplicht.");
            if (dto.RequiredVolunteers < 1) return BadRequest("Het aantal vrijwilligers moet minimaal 1 zijn.");

            activity.Title = dto.Title.Trim();
            activity.Description = dto.Description ?? "";
            activity.RequiredVolunteers = dto.RequiredVolunteers;
            activity.MaterialsNeeded = dto.MaterialsNeeded ?? "[]";
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("activity/{id:guid}")]
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
    }
}
