using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

/// <summary>Verwijdert verlopen werkdagen plus de gekoppelde taken en inschrijvingen.</summary>
public sealed class PastWorkDayCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PastWorkDayCleanupService> _logger;

    public PastWorkDayCleanupService(IServiceScopeFactory scopeFactory, ILogger<PastWorkDayCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await CleanupAsync(stoppingToken);
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
            await CleanupAsync(stoppingToken);
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var today = DateTime.Today;
            var oldDays = (await db.WorkDays.ToListAsync(cancellationToken))
                .Where(day => day.Date.Date < today)
                .ToList();
            if (oldDays.Count == 0) return;

            var ids = oldDays.Select(day => day.Id).ToList();
            var enrollments = await db.Enrollments.Where(e => ids.Contains(e.WorkDayId)).ToListAsync(cancellationToken);
            var activities = await db.Activities.Where(a => ids.Contains(a.WorkDayId)).ToListAsync(cancellationToken);
            db.Enrollments.RemoveRange(enrollments);
            db.Activities.RemoveRange(activities);
            db.WorkDays.RemoveRange(oldDays);
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Verwijderde {Count} verlopen werkdagen en hun gekoppelde gegevens.", oldDays.Count);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Applicatie wordt afgesloten.
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Opruimen van verlopen werkdagen is mislukt.");
        }
    }
}
