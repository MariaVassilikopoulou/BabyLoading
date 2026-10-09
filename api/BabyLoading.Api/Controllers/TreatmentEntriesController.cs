using BabyLoading.Api.Models;
using BabyLoading.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BabyLoading.Api.Controllers;

[ApiController]
[Route("api/treatment-entries")]
public class TreatmentEntriesController : ControllerBase
{
    private readonly CosmosRepository<TreatmentEntry> _repository;
    private readonly ICurrentUserService _currentUser;

    public TreatmentEntriesController(CosmosRepository<TreatmentEntry> repository, ICurrentUserService currentUser)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TreatmentEntry>>> List(CancellationToken ct)
        => Ok(await _repository.ListByUserAsync(_currentUser.UserId, ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<TreatmentEntry>> Get(string id, CancellationToken ct)
    {
        var entry = await _repository.GetAsync(id, _currentUser.UserId, ct);
        return entry is null ? NotFound() : Ok(entry);
    }

    [HttpPost]
    public async Task<ActionResult<TreatmentEntry>> Create(TreatmentEntry entry, CancellationToken ct)
    {
        entry.Id = Guid.NewGuid().ToString();
        entry.UserId = _currentUser.UserId;
        var created = await _repository.CreateAsync(entry, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TreatmentEntry>> Update(string id, TreatmentEntry entry, CancellationToken ct)
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
