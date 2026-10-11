using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
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
            var currentUserId = string.IsNullOrEmpty(userIdString) ? Guid.Empty : Guid.Parse(userIdString);
            var isAdmin = User.IsInRole("Admin");

            var workDays = await _context.WorkDays
                .Include(w => w.Activities)
                .Include(w => w.Enrollments)
                    .ThenInclude(e => e.User)
                .OrderBy(w => w.Date)
                .ToListAsync();

            // Mapping naar DTO's MET privacy check
            var result = workDays.Select(w => new WorkDayDto(
                w.Id,
                w.Date,
                w.Activities.Select(a => new ActivityDto(a.Id, a.Title, a.Description, a.RequiredVolunteers, a.MaterialsNeeded, a.IsCompleted)).ToList(),
                w.Enrollments.Select(e =>
                {
                    // Mag de ingelogde gebruiker alles zien? (Alleen als je Admin bent OF als het je eigen inschrijving is)
                    bool canSeeDetails = isAdmin || e.UserId == currentUserId;

                    return new EnrollmentDto
                    {
                        Id = e.Id,
                        ActivityId = e.ActivityId,
                        WorkDayId = e.WorkDayId,
                        FirstName = e.User!.FirstName,
                        // Privacy logic: velden verbergen voor andere volunteers
                        LastName = canSeeDetails ? e.User.LastName : null,
                        BringsVehicle = canSeeDetails ? e.BringsVehicle : null,
                        BringsTools = canSeeDetails ? e.BringsTools : null,
                        SpecificSkills = canSeeDetails ? e.SpecificSkills : null,
                        Remarks = canSeeDetails ? e.Remarks : null
                    };
                }).ToList()
            )).ToList();

            return Ok(result);
        }

        [Authorize] // Alleen ingelogde gebruikers mogen zich inschrijven
        [HttpPost("enroll")]
        public async Task<IActionResult> Enroll(CreateEnrollmentDto dto)
        {
            // Haal het ID van de ingelogde gebruiker op uit het JWT token
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString)) 
                return Unauthorized("Niet ingelogd.");
                
            var userId = Guid.Parse(userIdString);

            // Optionele check: is de gebruiker al ingeschreven voor deze specifieke activiteit?
            var isAlreadyEnrolled = await _context.Enrollments.AnyAsync(e => 
                e.UserId == userId && 
                e.WorkDayId == dto.WorkDayId && 
                e.ActivityId == dto.ActivityId);

            if (isAlreadyEnrolled)
                return BadRequest("Je bent al ingeschreven voor deze taak.");

            var enrollment = new Enrollment
            {
                UserId = userId,
                WorkDayId = dto.WorkDayId,
                ActivityId = dto.ActivityId,
                BringsVehicle = dto.BringsVehicle,
                BringsTools = dto.BringsTools,
                SelectedTools = dto.SelectedTools ?? "",
                SpecificSkills = dto.SpecificSkills ?? "",
                Remarks = dto.Remarks ?? ""
            };

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("workday")]
        public async Task<IActionResult> CreateWorkDay(CreateWorkDayDto dto)
        {
            // Zorg dat we een schone start-van-de-dag datum hebben
            var dateToSave = new DateTime(dto.Date.Year, dto.Date.Month, dto.Date.Day);
            
            // Haal alle dagen op en vergelijk de date in het geheugen (veilig voor SQLite)
            var existingDays = await _context.WorkDays.ToListAsync();
            var dayExists = existingDays.Any(w => w.Date.Year == dateToSave.Year && 
                                                  w.Date.Month == dateToSave.Month && 
                                                  w.Date.Day == dateToSave.Day);

            if (dayExists)
            {
                return BadRequest("Er is al een werkdag ingepland op deze datum.");
            }

            var workDay = new WorkDay { Date = dateToSave };
            _context.WorkDays.Add(workDay);
            await _context.SaveChangesAsync();
            
            return Ok(workDay.Id);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("workday/{id}")]
        public async Task<IActionResult> DeleteWorkDay(Guid id)
        {
            var workDay = await _context.WorkDays
                .Include(w => w.Activities)
                .Include(w => w.Enrollments)
                .FirstOrDefaultAsync(w => w.Id == id);
                
            if (workDay == null) return NotFound();

            // Verwijder eerst alle afhankelijkheden
            _context.Enrollments.RemoveRange(workDay.Enrollments);
            _context.Activities.RemoveRange(workDay.Activities);
            _context.WorkDays.Remove(workDay);
            
            await _context.SaveChangesAsync();
            return Ok();
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("activity")]
        public async Task<IActionResult> CreateActivity(CreateActivityDto dto)
        {
            var workDayExists = await _context.WorkDays.AnyAsync(w => w.Id == dto.WorkDayId);
            if (!workDayExists) 
                return NotFound("Werkdag niet gevonden.");

            var activity = new Activity
            {
                WorkDayId = dto.WorkDayId,
                Title = dto.Title,
                Description = dto.Description ?? "",
                RequiredVolunteers = dto.RequiredVolunteers,
                MaterialsNeeded = dto.MaterialsNeeded ?? "",
            };

            _context.Activities.Add(activity);
            await _context.SaveChangesAsync();
            
            return Ok(activity.Id);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("activity/{id}")]
        public async Task<IActionResult> UpdateActivity(Guid id, CreateActivityDto dto)
        {
            var activity = await _context.Activities.FindAsync(id);
            if (activity == null) return NotFound();

            activity.Title = dto.Title;
            activity.Description = dto.Description ?? "";
            activity.RequiredVolunteers = dto.RequiredVolunteers;
            activity.MaterialsNeeded = dto.MaterialsNeeded ?? "";
            
            await _context.SaveChangesAsync();
            return Ok();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("activity/{id}")]
        public async Task<IActionResult> DeleteActivity(Guid id)
        {
            var activity = await _context.Activities.Include(a => a.Enrollments).FirstOrDefaultAsync(a => a.Id == id);
            if (activity == null) return NotFound();

            _context.Enrollments.RemoveRange(activity.Enrollments); // Verwijder eerst de inschrijvingen
            _context.Activities.Remove(activity);
            
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}