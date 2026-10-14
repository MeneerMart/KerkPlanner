using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [Route("api/announcement")]
    [ApiController]
    public class AnnouncementController : ControllerBase
    {
        private const int MaxTitleLength = 100;
        private const int MaxMessageLength = 2000;
        private readonly AppDbContext _context;

        public AnnouncementController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<AnnouncementDto>> Get()
        {
            var announcement = await _context.Announcements.FindAsync(Announcement.SingletonId);
            return Ok(new AnnouncementDto(announcement?.Title ?? string.Empty, announcement?.Message ?? string.Empty));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut]
        public async Task<IActionResult> Update(AnnouncementDto dto)
        {
            var title = dto.Title?.Trim() ?? string.Empty;
            var message = dto.Message?.Trim() ?? string.Empty;
            if (title.Length > MaxTitleLength) return BadRequest($"De titel mag maximaal {MaxTitleLength} tekens bevatten.");
            if (message.Length > MaxMessageLength) return BadRequest($"De tekst mag maximaal {MaxMessageLength} tekens bevatten.");

            var announcement = await _context.Announcements.FindAsync(Announcement.SingletonId);
            if (announcement == null)
            {
                announcement = new Announcement();
                _context.Announcements.Add(announcement);
            }
            announcement.Title = title;
            announcement.Message = message;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
