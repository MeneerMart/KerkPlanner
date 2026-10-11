using KerkPlanner.Api.Data;
using KerkPlanner.Api.Domain;
using KerkPlanner.Api.Dtos;
using KerkPlanner.Api.Mapping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KerkPlanner.Api.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Admin))]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserListItemDto>>> List(CancellationToken cancellationToken)
    {
        var users = await _db.Users
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync(cancellationToken);

        return users.Select(DtoMapper.ToUserListItem).ToList();
    }
}
