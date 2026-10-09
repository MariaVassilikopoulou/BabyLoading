namespace BabyLoading.Api.Models;

public class Symptom
{
    public string Name { get; set; } = string.Empty;
    public int Severity { get; set; } // 1-5
}

public class JournalEntry : ICosmosItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Type { get; } = EntryTypes.Journal;

    public DateOnly Date { get; set; }
    public string Text { get; set; } = string.Empty;
    public int Mood { get; set; } // 1-5
    public List<Symptom> Symptoms { get; set; } = new();
    public JourneyPhase Phase { get; set; }

    // Pinned by her as a moment worth remembering; shown in the journey's milestone log.
    public bool IsMilestone { get; set; }

    // Snapshot at the time of writing, derived from the journey's conception path
    // (see GestationalAgeCalculator). Only meaningful while Phase == Pregnant.
    public int? PregnancyWeek { get; set; }
}
