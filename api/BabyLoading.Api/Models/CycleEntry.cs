namespace BabyLoading.Api.Models;

public enum CycleEntryType
{
    Period,
    LhTest,
    Temperature
}

public class CycleEntry : ICosmosItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Type { get; } = EntryTypes.Cycle;

    public DateOnly Date { get; set; }
    public CycleEntryType EntryType { get; set; }

    // Period: flow intensity (1-3). LhTest: 1 = positive, 0 = negative. Temperature: basal body temp in Celsius.
    public double Value { get; set; }
}
