using System.Net;
using BabyLoading.Api.Models;
using Microsoft.Azure.Cosmos;

namespace BabyLoading.Api.Services;

public class CosmosRepository<T> where T : class, ICosmosItem
{
    private readonly Container _container;
    private readonly string _type;

    public CosmosRepository(Container container, string type)
    {
        _container = container;
        _type = type;
    }

    public async Task<T> CreateAsync(T item, CancellationToken ct = default)
    {
        var response = await _container.CreateItemAsync(item, new PartitionKey(item.UserId), cancellationToken: ct);
        return response.Resource;
    }

    public async Task<T?> GetAsync(string id, string userId, CancellationToken ct = default)
    {
        try
        {
            var response = await _container.ReadItemAsync<T>(id, new PartitionKey(userId), cancellationToken: ct);
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<IReadOnlyList<T>> ListByUserAsync(string userId, CancellationToken ct = default)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId AND c.type = @type")
            .WithParameter("@userId", userId)
            .WithParameter("@type", _type);

        var results = new List<T>();
        using var iterator = _container.GetItemQueryIterator<T>(
            query,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(userId) });

        while (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync(ct);
            results.AddRange(page);
        }

        return results;
    }

    public async Task<T> UpsertAsync(T item, CancellationToken ct = default)
    {
        var response = await _container.UpsertItemAsync(item, new PartitionKey(item.UserId), cancellationToken: ct);
        return response.Resource;
    }

    public async Task DeleteAsync(string id, string userId, CancellationToken ct = default)
    {
        await _container.DeleteItemAsync<T>(id, new PartitionKey(userId), cancellationToken: ct);
    }
}
