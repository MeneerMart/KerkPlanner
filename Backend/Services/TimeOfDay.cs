using System.Globalization;

namespace Backend.Services
{
    public static class TimeOfDay
    {
        /// <summary>Zet "9:00" of "09:00:00" om naar "09:00". Leeg wordt null. Geeft false bij een ongeldige tijd.</summary>
        public static bool TryNormalize(string? value, out string? normalized)
        {
            normalized = null;
            if (string.IsNullOrWhiteSpace(value)) return true;
            if (!TimeOnly.TryParse(value.Trim(), CultureInfo.InvariantCulture, out var time)) return false;
            normalized = time.ToString("HH:mm", CultureInfo.InvariantCulture);
            return true;
        }
    }
}
