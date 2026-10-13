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

    // Maak de eerste beheerder aan als die nog niet bestaat en er een wachtwoord is ingesteld.
    if (!dbContext.Users.Any(u => u.Role == "Admin"))
    {
        var adminEmail = app.Configuration["Admin:Email"];
        var adminPassword = app.Configuration["Admin:Password"];
        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
        {
            app.Logger.LogWarning("Er is nog geen beheerder. Stel Admin:Email en Admin:Password in om er een aan te maken.");
        }
        else
        {
            dbContext.Users.Add(new Backend.Models.User
            {
                Email = adminEmail.Trim(),
                FirstName = "Admin",
                LastName = "Kerk",
                Role = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword)
            });
            dbContext.SaveChanges();
        }
    }
}

app.Run();
