using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [Route("api/planning/enroll")]
    [ApiController]
    [Authorize]
    public class EnrollmentsController : ControllerBase
    {
        private const int MaxSkillsLength = 250;
        private readonly AppDbContext _context;

        public EnrollmentsController(AppDbContext context) => _context = context;

        private record EnrollmentDetails(Guid WorkDayId, Guid? ActivityId, string? TimeSlot, bool BringsVehicle, string? SelectedTools, string? SpecificSkills, string? Remarks);

        [HttpPost]
        public async Task<IActionResult> Enroll(CreateEnrollmentDto dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized("Niet ingelogd.");
            return await CreateEnrollment(userId, null, null, null,
                new EnrollmentDetails(dto.WorkDayId, dto.ActivityId, dto.TimeSlot, dto.BringsVehicle, dto.SelectedTools, dto.SpecificSkills, dto.Remarks));
        }

        [HttpPut("{id:guid}")]
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

            var details = new EnrollmentDetails(dto.WorkDayId, dto.ActivityId, dto.TimeSlot, dto.BringsVehicle, dto.SelectedTools, dto.SpecificSkills, dto.Remarks);
            var validation = await Validate(details);
            if (validation != null) return validation;

            ApplyDetails(enrollment, details);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{id:guid}")]
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
        [HttpPost("admin")]
        public async Task<IActionResult> AdminEnroll(AdminCreateEnrollmentDto dto)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.UserId);
            if (!userExists) return NotFound("Gebruiker niet gevonden.");
            return await CreateEnrollment(dto.UserId, null, null, null,
                new EnrollmentDetails(dto.WorkDayId, dto.ActivityId, dto.TimeSlot, dto.BringsVehicle, dto.SelectedTools, dto.SpecificSkills, dto.Remarks));
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("admin/guest")]
        public async Task<IActionResult> AdminEnrollGuest(AdminCreateGuestEnrollmentDto dto)
        {
            var firstName = dto.FirstName?.Trim() ?? string.Empty;
            var lastName = dto.LastName?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(firstName)) return BadRequest("Voornaam is verplicht.");
            if (string.IsNullOrWhiteSpace(lastName)) return BadRequest("Achternaam is verplicht.");
            if (firstName.Length > 50 || lastName.Length > 50) return BadRequest("Voor- en achternaam mogen maximaal 50 tekens bevatten.");
            if (dto.PhoneNumber?.Trim().Length > 20) return BadRequest("Het telefoonnummer mag maximaal 20 tekens bevatten.");

            return await CreateEnrollment(null, firstName, lastName, dto.PhoneNumber?.Trim(),
                new EnrollmentDetails(dto.WorkDayId, dto.ActivityId, dto.TimeSlot, dto.BringsVehicle, dto.SelectedTools, dto.SpecificSkills, dto.Remarks));
        }

        private async Task<IActionResult> CreateEnrollment(Guid? userId, string? firstName, string? lastName, string? phoneNumber, EnrollmentDetails details)
        {
            var validation = await Validate(details);
            if (validation != null) return validation;

            bool duplicate;
            if (userId.HasValue)
            {
                duplicate = await _context.Enrollments.AnyAsync(e => e.UserId == userId && e.WorkDayId == details.WorkDayId && e.ActivityId == details.ActivityId);
            }
            else
            {
                var normalizedPhone = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber;
                duplicate = await _context.Enrollments.AnyAsync(e => e.UserId == null && e.FirstName.ToLower() == firstName!.ToLower() && e.LastName.ToLower() == lastName!.ToLower() && e.PhoneNumber == normalizedPhone && e.WorkDayId == details.WorkDayId && e.ActivityId == details.ActivityId);
            }
            if (duplicate) return BadRequest("Deze persoon is al ingeschreven voor deze taak.");

            var enrollment = new Enrollment
            {
                UserId = userId,
                FirstName = userId.HasValue ? string.Empty : firstName!.Trim(),
                LastName = userId.HasValue ? string.Empty : lastName!.Trim(),
                PhoneNumber = userId.HasValue ? null : (string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim()),
            };
            ApplyDetails(enrollment, details);

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();
            return Ok(enrollment.Id);
        }

        private static void ApplyDetails(Enrollment enrollment, EnrollmentDetails details)
        {
            enrollment.WorkDayId = details.WorkDayId;
            enrollment.ActivityId = details.ActivityId;
            enrollment.TimeSlot = TimeSlots.Normalize(details.TimeSlot);
            enrollment.BringsVehicle = details.BringsVehicle;
            enrollment.BringsTools = !string.IsNullOrWhiteSpace(details.SelectedTools) && details.SelectedTools != "{}";
            enrollment.SelectedTools = details.SelectedTools ?? "{}";
            enrollment.SpecificSkills = details.SpecificSkills?.Trim() ?? "";
            enrollment.Remarks = details.Remarks ?? "";
        }

        private async Task<IActionResult?> Validate(EnrollmentDetails details)
        {
            if (details.SpecificSkills?.Trim().Length > MaxSkillsLength)
                return BadRequest($"Vaardigheden mogen maximaal {MaxSkillsLength} tekens bevatten.");

            var workDay = await _context.WorkDays.FirstOrDefaultAsync(w => w.Id == details.WorkDayId);
            if (workDay == null) return NotFound("Werkdag niet gevonden.");
            if (workDay.Date.Date < DateTime.Today) return BadRequest("Deze werkdag is voorbij.");
            if (details.ActivityId.HasValue)
            {
                var activityMatchesDay = await _context.Activities.AnyAsync(a => a.Id == details.ActivityId.Value && a.WorkDayId == details.WorkDayId);
                if (!activityMatchesDay) return BadRequest("De gekozen taak hoort niet bij deze werkdag.");
            }
            return null;
        }
    }
}
