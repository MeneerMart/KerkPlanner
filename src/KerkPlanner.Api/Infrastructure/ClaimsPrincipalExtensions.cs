using System.Security.Claims;
using KerkPlanner.Api.Domain;

namespace KerkPlanner.Api.Infrastructure;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(value, out var id))
        {
            throw new InvalidOperationException("Geen geldige gebruiker in het token.");
        }

        return id;
    }

    public static bool IsAdmin(this ClaimsPrincipal user) =>
        user.IsInRole(nameof(UserRole.Admin));
}
