using BabyLoading.Api.Dtos;
using BabyLoading.Api.Models;
using BabyLoading.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BabyLoading.Api.Controllers;

[ApiController]
[Route("api/journeys")]
public class JourneysController : ControllerBase
{
    private readonly CosmosRepository<Journey> _repository;
    private readonly JourneyService _journeyService;
    private readonly ICurrentUserService _currentUser;

    public JourneysController(
        CosmosRepository<Journey> repository,
        JourneyService journeyService,
        ICurrentUserService currentUser)
    {
        _repository = repository;
        _journeyService = journeyService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Journey>>> List(CancellationToken ct)
        => Ok(await _repository.ListByUserAsync(_currentUser.UserId, ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<Journey>> Get(string id, CancellationToken ct)
    {
        var journey = await _repository.GetAsync(id, _currentUser.UserId, ct);
        return journey is null ? NotFound() : Ok(journey);
    }

    [HttpPost]
    public async Task<ActionResult<Journey>> Create(Journey journey, CancellationToken ct)
    {
        journey.Id = Guid.NewGuid().ToString();
        journey.UserId = _currentUser.UserId;
        var created = await _repository.CreateAsync(journey, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPost("{id}/phase")]
    public async Task<ActionResult<Journey>> ChangePhase(string id, ChangePhaseRequest request, CancellationToken ct)
    {
        try
        {
            var updated = await _journeyService.ChangePhaseAsync(_currentUser.UserId, id, request.Phase, request.Outcome, ct);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}/gestational-age")]
    public async Task<ActionResult> GetGestationalAge(string id, CancellationToken ct)
    {
        var journey = await _repository.GetAsync(id, _currentUser.UserId, ct);
        if (journey is null)
        {
            return NotFound();
        }

        if (journey.Phase != JourneyPhase.Pregnant)
        {
            return BadRequest("Journey is not in the pregnant phase.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (journey.ConceptionPath == Models.ConceptionPath.Ivf
            && journey.IvfTransferDate is not null
            && journey.IvfTransferDayNumber is not null)
        {
            var age = GestationalAgeCalculator.FromIvfTransfer(journey.IvfTransferDate.Value, journey.IvfTransferDayNumber.Value, today);
            var dueDate = GestationalAgeCalculator.EstimatedDueDateFromIvfTransfer(journey.IvfTransferDate.Value, journey.IvfTransferDayNumber.Value);
            return Ok(new { weeks = age.Weeks, days = age.Days, estimatedDueDate = dueDate });
        }

        if (journey.LastMenstrualPeriodDate is not null)
        {
            var age = GestationalAgeCalculator.FromLastMenstrualPeriod(journey.LastMenstrualPeriodDate.Value, today);
            var dueDate = GestationalAgeCalculator.EstimatedDueDateFromLmp(journey.LastMenstrualPeriodDate.Value);
            return Ok(new { weeks = age.Weeks, days = age.Days, estimatedDueDate = dueDate });
        }

        return BadRequest("Journey is missing a conception reference date (LMP or IVF transfer date).");
    }
}
