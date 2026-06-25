using MediatR;

namespace GrammarService.Application.Features.GrammarBand.Commands.CreateGrammarBand;

public sealed record CreateGrammarBandCommand(
    string Name,
    string Description,
    int Order
) : IRequest<Guid>;