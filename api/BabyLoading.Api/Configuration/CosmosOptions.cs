namespace BabyLoading.Api.Configuration;

public class CosmosOptions
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = "BabyLoading";
    public string ContainerName { get; set; } = "entries";
}
