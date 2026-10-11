using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using KerkPlanner.Api.Domain;
using Microsoft.IdentityModel.Tokens;

namespace KerkPlanner.Api.Infrastructure;

public interface IJwtTokenService
{
    string CreateToken(User user, out DateTimeOffset expiresAt);
}

public sealed class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreateToken(User user, out DateTimeOffset expiresAt)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key ontbreekt.");
        var issuer = _configuration["Jwt:Issuer"] ?? "KerkPlanner";
        var audience = _configuration["Jwt:Audience"] ?? "KerkPlanner";
        var minutes = int.TryParse(_configuration["Jwt:ExpiresInMinutes"], out var parsed)
            ? parsed
            : 10080;

        expiresAt = DateTimeOffset.UtcNow.AddMinutes(minutes);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.GivenName, user.FirstName),
            new Claim(ClaimTypes.Surname, user.LastName),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
