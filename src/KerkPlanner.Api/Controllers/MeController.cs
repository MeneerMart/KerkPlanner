using KerkPlanner.Api.Data;
using KerkPlanner.Api.Dtos;
using KerkPlanner.Api.Infrastructure;
using KerkPlanner.Api.Mapping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KerkPlanner.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/me")]
public class MeController : ControllerBase
{
    private readonly AppDbContext _db;

    public MeController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<CurrentUserDto>> Get(CancellationToken cancellationToken)
    {
        var user = await _db.Users.FindAsync([User.GetUserId()], cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        return DtoMapper.ToCurrentUser(user);
    }

    [HttpPut]
    public async Task<ActionResult<CurrentUserDto>> Update(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FindAsync([User.GetUserId()], cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        await _db.SaveChangesAsync(cancellationToken);

        return DtoMapper.ToCurrentUser(user);
    }

    [HttpGet("enrollments")]
    public async Task<ActionResult<List<EnrollmentDto>>> GetEnrollments(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var isAdmin = User.IsAdmin();
        var enrollments = await _db.Enrollments
            .IncludeEnrollment()
            .Where(e => e.UserId == userId)
            .OrderBy(e => e.WorkDayId)
            .ToListAsync(cancellationToken);

        return enrollments.Select(e => DtoMapper.ToEnrollment(e, userId, isAdmin)).ToList();
    }
}
