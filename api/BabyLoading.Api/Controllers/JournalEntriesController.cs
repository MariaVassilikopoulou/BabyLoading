using BabyLoading.Api.Models;
using BabyLoading.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BabyLoading.Api.Controllers;

[ApiController]
[Route("api/journal-entries")]
public class JournalEntriesController : ControllerBase
{
    private readonly CosmosRepository<JournalEntry> _repository;
    private readonly ICurrentUserService _currentUser;

    public JournalEntriesController(CosmosRepository<JournalEntry> repository, ICurrentUserService currentUser)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<JournalEntry>>> List(CancellationToken ct)
        => Ok(await _repository.ListByUserAsync(_currentUser.UserId, ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<JournalEntry>> Get(string id, CancellationToken ct)
    {
        var entry = await _repository.GetAsync(id, _currentUser.UserId, ct);
        return entry is null ? NotFound() : Ok(entry);
    }

    [HttpPost]
    public async Task<ActionResult<JournalEntry>> Create(JournalEntry entry, CancellationToken ct)
    {
        entry.Id = Guid.NewGuid().ToString();
        entry.UserId = _currentUser.UserId;
        var created = await _repository.CreateAsync(entry, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<JournalEntry>> Update(string id, JournalEntry entry, CancellationToken ct)
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
