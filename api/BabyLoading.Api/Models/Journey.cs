namespace BabyLoading.Api.Models;

public enum JourneyPhase
{
    Trying,
    Treatment,
    Pregnant,
    Postpartum,
    Ended
}

public enum JourneyOutcome
{
    Birth,
    Loss,
    Stopped
}

public enum ConceptionPath
{
    Natural,
    Iui,
    Ivf
}

public class Journey : ICosmosItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Type { get; } = EntryTypes.Journey;

    public JourneyPhase Phase { get; set; } = JourneyPhase.Trying;
    public DateOnly StartDate { get; set; }
    public JourneyOutcome? Outcome { get; set; }

    public ConceptionPath? ConceptionPath { get; set; }

    // Natural and IUI are dated from LMP — IUI approximates natural ovulation timing,
    // so it doesn't get its own offset (see GestationalAgeCalculator).
    public DateOnly? LastMenstrualPeriodDate { get; set; }

    // IVF only: dated from the known transfer day, which is more precise than LMP.
    public DateOnly? IvfTransferDate { get; set; }
    public int? IvfTransferDayNumber { get; set; }

    // Set when phase moves to Postpartum (outcome = Birth); used to time-box that phase.
    public DateOnly? PostpartumStartDate { get; set; }
}
