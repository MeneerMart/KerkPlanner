using System.Text.Json;
using Backend.Models;

namespace Backend.Services
{
    public static class ToolTotals
    {
        /// <summary>Telt per gereedschap op hoeveel stuks de inschrijvingen samen meenemen, als JSON-object.</summary>
        public static string Calculate(IEnumerable<Enrollment> enrollments)
        {
            var totals = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var enrollment in enrollments)
            {
                var raw = enrollment.SelectedTools;
                if (string.IsNullOrWhiteSpace(raw)) continue;
                try
                {
                    using var document = JsonDocument.Parse(raw);
                    if (document.RootElement.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var property in document.RootElement.EnumerateObject())
                        {
                            if (!property.Value.TryGetInt32(out var amount) || amount <= 0) continue;
                            totals[property.Name] = totals.GetValueOrDefault(property.Name) + amount;
                        }
                    }
                    else if (document.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in document.RootElement.EnumerateArray())
                        {
                            if (item.ValueKind != JsonValueKind.String) continue;
                            var name = item.GetString()?.Trim();
                            if (!string.IsNullOrWhiteSpace(name)) totals[name] = totals.GetValueOrDefault(name) + 1;
                        }
                    }
                }
                catch (JsonException)
                {
                    // Ondersteun bestaande inschrijvingen met de oude komma-gescheiden opslag.
                    foreach (var name in raw.Split(',').Select(value => value.Trim()).Where(value => value.Length > 0))
                        totals[name] = totals.GetValueOrDefault(name) + 1;
                }
            }
            return JsonSerializer.Serialize(totals);
        }
    }
}
