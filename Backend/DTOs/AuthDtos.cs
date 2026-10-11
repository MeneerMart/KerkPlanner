using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public record RegisterDto([Required, EmailAddress] string Email, [Required] string FirstName, [Required] string LastName, [Required] string Password, string? PhoneNumber);
    public record LoginDto([Required, EmailAddress] string Email, [Required] string Password);
    public record AuthResponseDto(string Token, string FirstName, string Role);
}