using GrammarService.Application.Features.GrammarBand.DTOs;
using GrammarService.Domain.Interfaces;
using MediatR;

namespace GrammarService.Application.Features.GrammarBand.Queries.GetAllGrammarBands;

public sealed class GetAllGrammarBandsHandler
    : IRequestHandler<GetAllGrammarBandsQuery,
        List<GrammarBandDto>>
{
    private readonly IGrammarBandRepository _repository;

    public GetAllGrammarBandsHandler(
        IGrammarBandRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<GrammarBandDto>> Handle(
        GetAllGrammarBandsQuery request,
        CancellationToken cancellationToken)
    {
        var bands = await _repository.GetAllAsync();

        return bands.Select(x => new GrammarBandDto
        {
            Id = x.Id,
            Name = x.Name,
            Description = x.Description,
            Order = x.Order
        }).ToList();
    }
}