using KerkPlanner.Api.Domain;
using KerkPlanner.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace KerkPlanner.Api.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(
        AppDbContext db,
        IPasswordService passwords,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        var admin = await EnsureAdminAsync(db, passwords, configuration, cancellationToken);
        await EnsurePlaceholderScheduleAsync(db, admin, passwords, cancellationToken);
    }

    private static async Task<User> EnsureAdminAsync(
        AppDbContext db,
        IPasswordService passwords,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var admin = new User
        {
            FirstName = configuration["SeedAdmin:FirstName"] ?? "Admin",
            LastName = configuration["SeedAdmin:LastName"] ?? "Admin",
            Email = (configuration["SeedAdmin:Email"] ?? "admin@kerkplanner.nl").Trim().ToLowerInvariant(),
            Phone = configuration["SeedAdmin:Phone"] ?? "06-12345678",
            PasswordHash = passwords.Hash(configuration["SeedAdmin:Password"] ?? "admin"),
            Role = UserRole.Admin
        };

        db.Users.Add(admin);
        await db.SaveChangesAsync(cancellationToken);
        return admin;
    }

    private static async Task EnsurePlaceholderScheduleAsync(
        AppDbContext db,
        User admin,
        IPasswordService passwords,
        CancellationToken cancellationToken)
    {
        if (await db.WorkDays.AnyAsync(cancellationToken))
        {
            return;
        }

        var jan = await EnsureVolunteerAsync(
            db, passwords, "Jan", "de Boer", "jan@kerkplanner.nl", "06-11112222", cancellationToken);
        var anna = await EnsureVolunteerAsync(
            db, passwords, "Anna", "Visser", "anna@kerkplanner.nl", "06-33334444", cancellationToken);

        // ISO-weken 43 en 44 van 2026 (ma–za). Admins kunnen dit later aanpassen of verwijderen.
        var week43 = new DateOnly[]
        {
            new(2026, 10, 19),
            new(2026, 10, 20),
            new(2026, 10, 21),
            new(2026, 10, 22),
            new(2026, 10, 23),
            new(2026, 10, 24)
        };
        var week44 = new DateOnly[]
        {
            new(2026, 10, 26),
            new(2026, 10, 27),
            new(2026, 10, 28),
            new(2026, 10, 29),
            new(2026, 10, 30),
            new(2026, 10, 31)
        };

        foreach (var date in week43.Concat(week44))
        {
            db.WorkDays.Add(CreatePlaceholderWorkDay(date, admin.Id));
        }

        await db.SaveChangesAsync(cancellationToken);

        var workDays = await db.WorkDays.OrderBy(w => w.Date).ToListAsync(cancellationToken);
        foreach (var workDay in workDays)
        {
            foreach (var activity in CreatePlaceholderActivities(workDay.Id, workDay.Date))
            {
                db.Activities.Add(activity);
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        var firstDay = workDays[0];
        var firstActivities = await db.Activities
            .Where(a => a.WorkDayId == firstDay.Id)
            .OrderBy(a => a.Id)
            .ToListAsync(cancellationToken);

        if (firstActivities.Count >= 2)
        {
            db.Enrollments.Add(CreateEnrollment(jan.Id, firstDay.Id, firstActivities[0].Id, bringsVehicle: true, bringsTools: true, "Aanhanger + aanhangwagenrijbewijs", "Kan tot 16:00"));
            db.Enrollments.Add(CreateEnrollment(anna.Id, firstDay.Id, firstActivities[1].Id, bringsVehicle: false, bringsTools: true, "Ervaring met sloopwerk", null));
        }

        var secondDay = workDays[1];
        db.Enrollments.Add(CreateEnrollment(jan.Id, secondDay.Id, activityId: null, bringsVehicle: true, bringsTools: false, null, "Algemeen inzetbaar, tijd flexibel"));

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task<User> EnsureVolunteerAsync(
        AppDbContext db,
        IPasswordService passwords,
        string firstName,
        string lastName,
        string email,
        string phone,
        CancellationToken cancellationToken)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == normalized, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var user = new User
        {
            FirstName = firstName,
            LastName = lastName,
            Email = normalized,
            Phone = phone,
            PasswordHash = passwords.Hash("vrijwilliger"),
            Role = UserRole.Volunteer
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        return user;
    }

    private static WorkDay CreatePlaceholderWorkDay(DateOnly date, int adminId) => new()
    {
        Date = date,
        CoordinatorId = adminId,
        OpenerId = adminId,
        CloserId = adminId
    };

    private static IEnumerable<Activity> CreatePlaceholderActivities(int workDayId, DateOnly date)
    {
        var isWeekend = date.DayOfWeek is DayOfWeek.Saturday;
        var isStartWeek = date.DayOfYear <= new DateOnly(2026, 10, 24).DayOfYear;

        if (isStartWeek)
        {
            yield return Activity(
                workDayId,
                "Inventarisatie en sorteren",
                "Losse spullen, archiefmateriaal en herbruikbare items verzamelen en sorteren.",
                required: isWeekend ? 6 : 4,
                materials: "Vuilniszakken, labels, dozen, stift.",
                safety: "Til niet te zwaar; gebruik een steekwagen. Handschoenen verplicht.");

            yield return Activity(
                workDayId,
                "Demontage interieur",
                "Banken, kasten en los interieur loshalen en klaarzetten voor afvoer.",
                required: isWeekend ? 8 : 5,
                materials: "Accuschroefmachine, koevoet, spanbanden.",
                safety: "Veiligheidsschoenen en stofmasker verplicht. Werken met z'n tweeën bij zware objecten.");

            yield return Activity(
                workDayId,
                "Transport en afvoer",
                "Geladen aanhangers/busjes naar de milieustraat of opslag rijden.",
                required: 3,
                materials: "Aanhanger of bus, spanbanden, autogordels controleren.",
                safety: "Alleen rijden met geldig rijbewijs (BE indien aanhanger). Niet overbeladen.");
        }
        else
        {
            yield return Activity(
                workDayId,
                "Sloopwerk en puinruimen",
                "Niet-dragende onderdelen slopen en puin scheppen in containers.",
                required: isWeekend ? 10 : 6,
                materials: "Sloophamers, kruiwagens, emmers, scheppen.",
                safety: "Helm, bril, gehoorbescherming en veiligheidsschoenen verplicht. Asbestverdachte materialen niet aanraken — meld dit bij de coördinator.");

            yield return Activity(
                workDayId,
                "Schoonmaak en opruimen",
                "Stofzuigen, vegen en restafval verzamelen zodat de volgende ploeg verder kan.",
                required: 4,
                materials: "Bezems, stofzuiger, dweilen, vuilniszakken.",
                safety: "Stofmasker bij veel stof. Ramen openhouden voor ventilatie.");

            yield return Activity(
                workDayId,
                "Coördinatie ter plaatse",
                "Ploegen indelen, vragen beantwoorden en einde dag afsluiten.",
                required: 2,
                materials: "Plattegrond, presentielijst, EHBO-kit.",
                safety: "EHBO-kit en noodnummers bekendhouden. Kerk afsluiten volgens checklist.");
        }
    }

    private static Activity Activity(
        int workDayId,
        string title,
        string description,
        int required,
        string materials,
        string safety) => new()
    {
        WorkDayId = workDayId,
        Title = title,
        Description = description,
        RequiredVolunteers = required,
        MaterialsNeeded = materials,
        SafetyInstructions = safety,
        Status = ActivityStatus.Open
    };

    private static Enrollment CreateEnrollment(
        int userId,
        int workDayId,
        int? activityId,
        bool bringsVehicle,
        bool bringsTools,
        string? skills,
        string? remarks) => new()
    {
        UserId = userId,
        WorkDayId = workDayId,
        ActivityId = activityId,
        BringsVehicle = bringsVehicle,
        BringsTools = bringsTools,
        SpecificSkills = skills,
        Remarks = remarks
    };
}
