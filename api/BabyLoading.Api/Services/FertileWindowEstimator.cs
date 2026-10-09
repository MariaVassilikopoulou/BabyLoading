using BabyLoading.Api.Models;

namespace BabyLoading.Api.Services;

public record FertileWindowEstimate(
    DateOnly WindowStart,
    DateOnly WindowEnd,
    DateOnly EstimatedOvulationDay,
    bool IsEstimate);

// Estimates a fertile window from cycle history. This is always an estimate, never contraception
// (Constraint #3) — callers must present it as such.
public static class FertileWindowEstimator
{
    public static FertileWindowEstimate? Estimate(IReadOnlyList<CycleEntry> cycleEntries)
    {
        var periodStarts = cycleEntries
            .Where(e => e.EntryType == CycleEntryType.Period)
            .OrderBy(e => e.Date)
            .Select(e => e.Date)
            .ToList();

        if (periodStarts.Count == 0)
        {
            return null;
        }

        var lastPeriodStart = periodStarts[^1];

        // Average cycle length from consecutive period starts; default to 28 days with only one data point.
        var cycleLength = 28;
        if (periodStarts.Count >= 2)
        {
            var lengths = new List<int>();
            for (var i = 1; i < periodStarts.Count; i++)
            {
                lengths.Add(periodStarts[i].DayNumber - periodStarts[i - 1].DayNumber);
            }

            cycleLength = (int)Math.Round(lengths.Average());
        }

        var estimatedOvulationDay = lastPeriodStart.AddDays(cycleLength - 14);

        // A positive LH test overrides the calendar estimate: ovulation typically follows within 24-36 hours.
        var latestPositiveLh = cycleEntries
            .Where(e => e.EntryType == CycleEntryType.LhTest && e.Value >= 1 && e.Date >= lastPeriodStart)
            .OrderByDescending(e => e.Date)
            .FirstOrDefault();

        if (latestPositiveLh is not null)
        {
            estimatedOvulationDay = latestPositiveLh.Date.AddDays(1);
        }

        return new FertileWindowEstimate(
            WindowStart: estimatedOvulationDay.AddDays(-5),
            WindowEnd: estimatedOvulationDay.AddDays(1),
            EstimatedOvulationDay: estimatedOvulationDay,
            IsEstimate: true);
    }
}
