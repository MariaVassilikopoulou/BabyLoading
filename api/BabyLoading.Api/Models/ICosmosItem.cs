namespace BabyLoading.Api.Models;

public interface ICosmosItem
{
    string Id { get; set; }
    string UserId { get; set; }
    string Type { get; }
}

// One Cosmos container holds every entry type for a user, partitioned by /userId, distinguished
// by this discriminator. That lets a single change-feed processor (Phase 2) pick up every entry
// type instead of needing one per container.
public static class EntryTypes
{
    public const string Journal = "journal";
    public const string Cycle = "cycle";
    public const string Treatment = "treatment";
    public const string Journey = "journey";
}
