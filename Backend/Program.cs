using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Backend.Data;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Database configuratie
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection ontbreekt.");
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));
builder.Services.AddHostedService<PastWorkDayCleanupService>();

// 2. CORS configuratie: toegestane frontend-adressen staan in Cors:AllowedOrigins
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 3. JWT Authenticatie
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key ontbreekt of is korter dan 32 tekens.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend"); // Activeer CORS
app.UseAuthentication();      // Activeer Auth
app.UseAuthorization();
app.MapControllers();

// Lichte check voor uptime-monitoring (houdt de app ook wakker); raakt de database niet aan.
app.MapMethods("/health", ["GET", "HEAD"], () => Results.Text("OK"));

using (var scope = app.Services.CreateScope())
{
    // Zorg dat de map van het databasebestand bestaat (bijv. /home/data op Azure).
    var dataSource = new SqliteConnectionStringBuilder(connectionString).DataSource;
    var dataDirectory = Path.GetDirectoryName(Path.GetFullPath(dataSource));
    if (!string.IsNullOrEmpty(dataDirectory)) Directory.CreateDirectory(dataDirectory);

    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();

    // WAL werkt niet betrouwbaar op netwerkopslag zoals Azure /home; gebruik de standaard journal.
    dbContext.Database.ExecuteSqlRaw("PRAGMA journal_mode=DELETE;");

    EnsureConfiguredAdmin(dbContext, app.Configuration, app.Logger);
}

app.Run();

// Als Admin:Email en Admin:Password zijn ingesteld, zijn die leidend: het account wordt aangemaakt
// of bijgewerkt (rol Admin, wachtwoord uit de config). Zonder wachtwoord in de config verandert er niets.
static void EnsureConfiguredAdmin(AppDbContext dbContext, IConfiguration configuration, ILogger logger)
{
    var adminEmail = configuration["Admin:Email"]?.Trim();
    var adminPassword = configuration["Admin:Password"];
    if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
    {
        if (!dbContext.Users.Any(u => u.Role == "Admin"))
            logger.LogWarning("Er is nog geen beheerder. Stel Admin:Email en Admin:Password in om er een aan te maken.");
        return;
    }

    var normalizedEmail = adminEmail.ToLower();
    var admin = dbContext.Users.FirstOrDefault(u => u.Email.ToLower() == normalizedEmail);
    if (admin == null)
    {
        dbContext.Users.Add(new Backend.Models.User
        {
            Email = adminEmail,
            FirstName = "Admin",
            LastName = "Kerk",
            Role = "Admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword)
        });
        logger.LogInformation("Beheerder {Email} aangemaakt.", adminEmail);
    }
    else
    {
        admin.Role = "Admin";
        if (!BCrypt.Net.BCrypt.Verify(adminPassword, admin.PasswordHash))
            admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
    }
    dbContext.SaveChanges();
}
