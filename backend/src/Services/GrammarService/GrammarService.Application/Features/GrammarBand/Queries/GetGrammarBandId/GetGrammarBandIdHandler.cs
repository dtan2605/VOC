using GrammarService.Application.Features.GrammarBand.DTOs;
using GrammarService.Domain.Interfaces;
using MediatR;

namespace GrammarService.Application.Features.GrammarBand.Queries.GetGrammarBandById;

public sealed class GetGrammarBandByIdHandler
    : IRequestHandler<GetGrammarBandByIdQuery,
        GrammarBandDto?>
{
    private readonly IGrammarBandRepository _repository;

    public GetGrammarBandByIdHandler(
        IGrammarBandRepository repository)
    {
        _repository = repository;
    }

    public async Task<GrammarBandDto?> Handle(
        GetGrammarBandByIdQuery request,
        CancellationToken cancellationToken)
    {
        var band = await _repository.GetByIdAsync(request.Id);

        if (band is null)
            return null;

        return new GrammarBandDto
        {
            Id = band.Id,
            Name = band.Name,
            Description = band.Description,
            Order = band.Order
        };
    }
}