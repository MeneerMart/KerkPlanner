namespace Backend.Models
{
    public static class TimeSlots
    {
        public const string FullDay = "FullDay";
        public const string Morning = "Morning";
        public const string Afternoon = "Afternoon";
        public const string Evening = "Evening";

        public static readonly string[] All = [FullDay, Morning, Afternoon, Evening];

        public static string Normalize(string? value) =>
            All.FirstOrDefault(slot => string.Equals(slot, value, StringComparison.OrdinalIgnoreCase)) ?? FullDay;
    }
}
