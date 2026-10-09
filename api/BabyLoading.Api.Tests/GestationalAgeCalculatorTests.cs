using BabyLoading.Api.Services;
using Xunit;

namespace BabyLoading.Api.Tests;

public class GestationalAgeCalculatorTests
{
    [Fact]
    public void FromLastMenstrualPeriod_ComputesWeeksAndDays()
    {
        var lmp = new DateOnly(2026, 1, 1);
        var onDate = lmp.AddDays(14 * 7 + 3); // 14 weeks + 3 days

        var age = GestationalAgeCalculator.FromLastMenstrualPeriod(lmp, onDate);

        Assert.Equal(14, age.Weeks);
        Assert.Equal(3, age.Days);
    }

    [Fact]
    public void EstimatedDueDateFromLmp_Is280DaysAfterLmp()
    {
        var lmp = new DateOnly(2026, 1, 1);

        var dueDate = GestationalAgeCalculator.EstimatedDueDateFromLmp(lmp);

        Assert.Equal(lmp.AddDays(280), dueDate);
    }

    [Fact]
    public void FromIvfTransfer_Day5_IsMoreAdvancedThanDay3_OnSameTransferDate()
    {
        var transferDate = new DateOnly(2026, 1, 1);
        var onDate = transferDate.AddDays(10);

        var day5Age = GestationalAgeCalculator.FromIvfTransfer(transferDate, 5, onDate);
        var day3Age = GestationalAgeCalculator.FromIvfTransfer(transferDate, 3, onDate);

        var day5TotalDays = day5Age.Weeks * 7 + day5Age.Days;
        var day3TotalDays = day3Age.Weeks * 7 + day3Age.Days;

        Assert.Equal(2, day5TotalDays - day3TotalDays);
    }

    [Theory]
    [InlineData(5, 261)]
    [InlineData(3, 263)]
    public void EstimatedDueDateFromIvfTransfer_UsesKnownClinicalOffsets(int transferDayNumber, int expectedOffsetDays)
    {
        var transferDate = new DateOnly(2026, 1, 1);

        var dueDate = GestationalAgeCalculator.EstimatedDueDateFromIvfTransfer(transferDate, transferDayNumber);

        Assert.Equal(transferDate.AddDays(expectedOffsetDays), dueDate);
    }
}
