namespace BabyLoading.Api.Models;

public class ScanResult
{
    public int? FollicleCount { get; set; }
    public double? LiningMm { get; set; }
}

public class TreatmentEntry : ICosmosItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Type { get; } = EntryTypes.Treatment;

    public DateOnly Date { get; set; }
    public int? CycleDay { get; set; }
    public string? Medication { get; set; }
    public string? Dose { get; set; }

    // Precise timing matters for trigger shots.
    public TimeOnly? Time { get; set; }
    public bool ClinicVisit { get; set; }
    public ScanResult? ScanResults { get; set; }
    public double? BetaHcgResult { get; set; }
}
