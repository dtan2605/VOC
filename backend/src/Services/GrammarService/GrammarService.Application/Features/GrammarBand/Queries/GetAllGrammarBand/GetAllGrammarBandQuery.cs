using GrammarService.Application.Features.GrammarBand.DTOs;
using MediatR;

namespace GrammarService.Application.Features.GrammarBand.Queries.GetAllGrammarBands;

public sealed record GetAllGrammarBandsQuery()
    : IRequest<List<GrammarBandDto>>;