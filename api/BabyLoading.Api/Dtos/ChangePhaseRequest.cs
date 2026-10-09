using BabyLoading.Api.Models;

namespace BabyLoading.Api.Dtos;

public record ChangePhaseRequest(JourneyPhase Phase, JourneyOutcome? Outcome);
