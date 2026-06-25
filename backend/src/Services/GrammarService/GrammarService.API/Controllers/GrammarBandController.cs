using GrammarService.Application.Features.GrammarBand.Commands.CreateGrammarBand;
using GrammarService.Application.Features.GrammarBand.Commands.DeleteGrammarBand;
using GrammarService.Application.Features.GrammarBand.Commands.UpdateGrammarBand;
using GrammarService.Application.Features.GrammarBand.Queries.GetAllGrammarBands;
using GrammarService.Application.Features.GrammarBand.Queries.GetGrammarBandById;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GrammarService.API.Controllers;

[ApiController]
[Route("api/grammar-bands")]
public class GrammarBandController : ControllerBase
{
    private readonly IMediator _mediator;

    public GrammarBandController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(
            await _mediator.Send(
                new GetAllGrammarBandsQuery()));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result =
            await _mediator.Send(
                new GetGrammarBandByIdQuery(id));

        return result is null
            ? NotFound()
            : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateGrammarBandCommand command)
    {
        var id = await _mediator.Send(command);

        return CreatedAtAction(
            nameof(GetById),
            new { id },
            id);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateGrammarBandCommand command)
    {
        if (id != command.Id)
            return BadRequest();

        var result =
            await _mediator.Send(command);

        return result
            ? NoContent()
            : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result =
            await _mediator.Send(
                new DeleteGrammarBandCommand(id));

        return result
            ? NoContent()
            : NotFound();
    }
}