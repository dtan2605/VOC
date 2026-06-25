using GrammarService.Application.Features.GrammarBand.DTOs;
using MediatR;

namespace GrammarService.Application.Features.GrammarBand.Queries.GetGrammarBandById;

public sealed record GetGrammarBandByIdQuery(
    Guid Id
) : IRequest<GrammarBandDto?>;