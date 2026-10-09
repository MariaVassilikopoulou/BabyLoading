using BabyLoading.Api.Models;
using BabyLoading.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BabyLoading.Api.Controllers;

[ApiController]
[Route("api/cycle-entries")]
public class CycleEntriesController : ControllerBase
{
    private readonly CosmosRepository<CycleEntry> _repository;
    private readonly ICurrentUserService _currentUser;

    public CycleEntriesController(CosmosRepository<CycleEntry> repository, ICurrentUserService currentUser)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CycleEntry>>> List(CancellationToken ct)
        => Ok(await _repository.ListByUserAsync(_currentUser.UserId, ct));

    [HttpGet("fertile-window")]
    public async Task<ActionResult<FertileWindowEstimate>> GetFertileWindow(CancellationToken ct)
    {
        var entries = await _repository.ListByUserAsync(_currentUser.UserId, ct);
        var estimate = FertileWindowEstimator.Estimate(entries);
        return estimate is null ? NotFound("Not enough cycle data yet.") : Ok(estimate);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CycleEntry>> Get(string id, CancellationToken ct)
    {
        var entry = await _repository.GetAsync(id, _currentUser.UserId, ct);
        return entry is null ? NotFound() : Ok(entry);
    }

    [HttpPost]
    public async Task<ActionResult<CycleEntry>> Create(CycleEntry entry, CancellationToken ct)
    {
        entry.Id = Guid.NewGuid().ToString();
        entry.UserId = _currentUser.UserId;
        var created = await _repository.CreateAsync(entry, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CycleEntry>> Update(string id, CycleEntry entry, CancellationToken ct)
    {
        if (id != entry.Id)
        {
            return BadRequest("Id in the URL and body must match.");
        }

        entry.UserId = _currentUser.UserId;

        var existing = await _repository.GetAsync(id, _currentUser.UserId, ct);
        if (existing is null)
        {
            return NotFound();
        }

        return Ok(await _repository.UpsertAsync(entry, ct));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _repository.DeleteAsync(id, _currentUser.UserId, ct);
        return NoContent();
    }
}
