using MediatR;

namespace GrammarService.Application.Features.GrammarBand.Commands.UpdateGrammarBand;

public sealed record UpdateGrammarBandCommand(
    Guid Id,
    string Name,
    string Description,
    int Order
) : IRequest<bool>;