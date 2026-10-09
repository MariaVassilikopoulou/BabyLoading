using BabyLoading.Api.Configuration;
using Microsoft.Azure.Cosmos;

namespace BabyLoading.Api.Services;

// Shared by the API (Program.cs) and the seed console app so both provision the same
// database/container/indexing policy instead of duplicating it.
public static class CosmosBootstrapper
{
    // The Cosmos DB Emulator serves a self-signed HTTPS certificate that isn't in the OS trust
    // store, so the SDK's default strict TLS validation rejects it. `acceptEmulatorCertificate`
    // must only ever be true for the local emulator (Development) — real Azure Cosmos DB in
    // Phase 5 has a publicly trusted certificate and must keep strict validation.
    public static CosmosClient CreateClient(CosmosOptions options, bool acceptEmulatorCertificate = false)
    {
        var clientOptions = new CosmosClientOptions
        {
            SerializerOptions = new CosmosSerializationOptions { PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase }
        };

        if (acceptEmulatorCertificate)
        {
            clientOptions.HttpClientFactory = () => new HttpClient(new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            });
            clientOptions.ConnectionMode = ConnectionMode.Gateway;
        }

        return new CosmosClient(options.ConnectionString, clientOptions);
    }

    // Local-dev convenience: auto-provision the database/container against the Cosmos DB Emulator.
    // In Azure (Phase 5) this would be replaced by infra-as-code (Bicep) provisioning.
    public static Container CreateContainer(CosmosClient client, CosmosOptions options)
    {
        var database = client.CreateDatabaseIfNotExistsAsync(options.DatabaseName).GetAwaiter().GetResult().Database;

        var containerProperties = new ContainerProperties(options.ContainerName, "/userId")
        {
            IndexingPolicy = new IndexingPolicy
            {
                IncludedPaths = { new IncludedPath { Path = "/*" } },
                ExcludedPaths =
                {
                    new ExcludedPath { Path = "/text/?" },
                }
            }
        };

        return database.CreateContainerIfNotExistsAsync(containerProperties).GetAwaiter().GetResult().Container;
    }
}
