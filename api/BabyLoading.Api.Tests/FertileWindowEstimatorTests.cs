using BabyLoading.Api.Models;
using BabyLoading.Api.Services;
using Xunit;

namespace BabyLoading.Api.Tests;

public class FertileWindowEstimatorTests
{
    [Fact]
    public void Estimate_ReturnsNull_WhenNoPeriodData()
    {
        var result = FertileWindowEstimator.Estimate([]);

        Assert.Null(result);
    }

    [Fact]
    public void Estimate_UsesDefault28DayCycle_WithOnlyOnePeriod()
    {
        var periodStart = new DateOnly(2026, 1, 1);
        var entries = new List<CycleEntry>
        {
            new() { UserId = "u1", Date = periodStart, EntryType = CycleEntryType.Period, Value = 1 }
        };

        var result = FertileWindowEstimator.Estimate(entries);

        Assert.NotNull(result);
        // 28-day cycle: ovulation ~day 14 after period start.
        Assert.Equal(periodStart.AddDays(14), result!.EstimatedOvulationDay);
        Assert.True(result.IsEstimate);
    }

    [Fact]
    public void Estimate_UsesAverageCycleLength_FromMultiplePeriods()
    {
        var entries = new List<CycleEntry>
        {
            new() { UserId = "u1", Date = new DateOnly(2026, 1, 1), EntryType = CycleEntryType.Period, Value = 1 },
            new() { UserId = "u1", Date = new DateOnly(2026, 1, 31), EntryType = CycleEntryType.Period, Value = 1 }, // 30-day cycle
        };

        var result = FertileWindowEstimator.Estimate(entries);

        Assert.NotNull(result);
        Assert.Equal(new DateOnly(2026, 1, 31).AddDays(30 - 14), result!.EstimatedOvulationDay);
    }

    [Fact]
    public void Estimate_PositiveLhTest_OverridesCalendarEstimate()
    {
        var periodStart = new DateOnly(2026, 1, 1);
        var lhPositiveDate = new DateOnly(2026, 1, 20);
        var entries = new List<CycleEntry>
        {
            new() { UserId = "u1", Date = periodStart, EntryType = CycleEntryType.Period, Value = 1 },
            new() { UserId = "u1", Date = lhPositiveDate, EntryType = CycleEntryType.LhTest, Value = 1 },
        };

        var result = FertileWindowEstimator.Estimate(entries);

        Assert.NotNull(result);
        Assert.Equal(lhPositiveDate.AddDays(1), result!.EstimatedOvulationDay);
    }

    [Fact]
    public void Estimate_IgnoresNegativeLhTest()
    {
        var periodStart = new DateOnly(2026, 1, 1);
        var entries = new List<CycleEntry>
        {
            new() { UserId = "u1", Date = periodStart, EntryType = CycleEntryType.Period, Value = 1 },
            new() { UserId = "u1", Date = periodStart.AddDays(10), EntryType = CycleEntryType.LhTest, Value = 0 },
        };

        var result = FertileWindowEstimator.Estimate(entries);

        Assert.NotNull(result);
        Assert.Equal(periodStart.AddDays(14), result!.EstimatedOvulationDay);
    }
}
