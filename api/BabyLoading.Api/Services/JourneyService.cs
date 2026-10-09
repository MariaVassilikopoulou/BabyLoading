using BabyLoading.Api.Models;

namespace BabyLoading.Api.Services;

public class JourneyService
{
    private readonly CosmosRepository<Journey> _repository;

    public JourneyService(CosmosRepository<Journey> repository)
    {
        _repository = repository;
    }

    public async Task<Journey> ChangePhaseAsync(
        string userId,
        string journeyId,
        JourneyPhase newPhase,
        JourneyOutcome? outcome,
        CancellationToken ct = default)
    {
        var journey = await _repository.GetAsync(journeyId, userId, ct)
            ?? throw new KeyNotFoundException("Journey not found.");

        if (newPhase == JourneyPhase.Postpartum && outcome != JourneyOutcome.Birth)
        {
            throw new InvalidOperationException("Moving to postpartum requires outcome = Birth.");
        }

        if (newPhase == JourneyPhase.Ended && outcome is null)
        {
            throw new InvalidOperationException("Ending a journey requires an outcome (Loss or Stopped).");
        }

        journey.Phase = newPhase;
        if (outcome is not null)
        {
            journey.Outcome = outcome;
        }

        if (newPhase == JourneyPhase.Postpartum)
        {
            journey.PostpartumStartDate = DateOnly.FromDateTime(DateTime.UtcNow);
        }

        return await _repository.UpsertAsync(journey, ct);
    }

    // Postpartum is time-boxed (~6-8 weeks). This only reports whether the window has elapsed;
    // it never pushes her to end the journey — she decides that herself (see PROJECT.md out-of-scope).
    public static bool IsPostpartumWindowElapsed(Journey journey, DateOnly today, int windowWeeks = 8)
    {
        if (journey.Phase != JourneyPhase.Postpartum || journey.PostpartumStartDate is null)
        {
            return false;
        }

        return today.DayNumber - journey.PostpartumStartDate.Value.DayNumber > windowWeeks * 7;
    }
}
