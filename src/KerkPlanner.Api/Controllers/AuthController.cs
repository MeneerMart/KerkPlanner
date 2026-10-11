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
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordService _passwords;
    private readonly IJwtTokenService _jwt;

    public AuthController(AppDbContext db, IPasswordService passwords, IJwtTokenService jwt)
    {
        _db = db;
        _passwords = passwords;
        _jwt = jwt;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email, cancellationToken))
        {
            return Conflict(new { message = "Dit e-mailadres is al in gebruik." });
        }

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            PasswordHash = _passwords.Hash(request.Password),
            Role = UserRole.Volunteer
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(CreateAuthResponse(user));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user is null || !_passwords.Verify(user, request.Password))
        {
            return Unauthorized(new { message = "Onjuist e-mailadres of wachtwoord." });
        }

        return Ok(CreateAuthResponse(user));
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        var token = _jwt.CreateToken(user, out var expiresAt);
        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = DtoMapper.ToCurrentUser(user)
        };
    }
}
