using BabyLoading.Api.Models;
using BabyLoading.Api.Services;
using Xunit;

namespace BabyLoading.Api.Tests;

public class JourneyServiceTests
{
    [Fact]
    public void IsPostpartumWindowElapsed_False_WhenNotInPostpartumPhase()
    {
        var journey = new Journey { UserId = "u1", Phase = JourneyPhase.Pregnant };

        Assert.False(JourneyService.IsPostpartumWindowElapsed(journey, DateOnly.FromDateTime(DateTime.UtcNow)));
    }

    [Fact]
    public void IsPostpartumWindowElapsed_False_WithinWindow()
    {
        var start = new DateOnly(2026, 1, 1);
        var journey = new Journey { UserId = "u1", Phase = JourneyPhase.Postpartum, PostpartumStartDate = start };

        var today = start.AddDays(4 * 7); // 4 weeks in

        Assert.False(JourneyService.IsPostpartumWindowElapsed(journey, today));
    }

    [Fact]
    public void IsPostpartumWindowElapsed_True_AfterWindow()
    {
        var start = new DateOnly(2026, 1, 1);
        var journey = new Journey { UserId = "u1", Phase = JourneyPhase.Postpartum, PostpartumStartDate = start };

        var today = start.AddDays(9 * 7); // 9 weeks in, past the default 8-week window

        Assert.True(JourneyService.IsPostpartumWindowElapsed(journey, today));
    }
}
