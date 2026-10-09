namespace BabyLoading.Api.Models;

public class ScanResult
{
    public int? FollicleCount { get; set; }
    public double? LiningMm { get; set; }
}

// Milestone steps of a treatment course. Optional: day-to-day entries (e.g. a single stimulation
// injection) may leave it unset. IUI courses simply skip Retrieval and Transfer.
public enum TreatmentStep
{
    Stimulation,
    Trigger,
    Retrieval,
    Transfer,
    PregnancyTest
}

public class TreatmentEntry : ICosmosItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Type { get; } = EntryTypes.Treatment;

    public DateOnly Date { get; set; }
    public TreatmentStep? Step { get; set; }
    public int? CycleDay { get; set; }
    public string? Medication { get; set; }
    public string? Dose { get; set; }

    // Precise timing matters for trigger shots.
    public TimeOnly? Time { get; set; }
    public bool ClinicVisit { get; set; }
    public ScanResult? ScanResults { get; set; }
    public double? BetaHcgResult { get; set; }
}
