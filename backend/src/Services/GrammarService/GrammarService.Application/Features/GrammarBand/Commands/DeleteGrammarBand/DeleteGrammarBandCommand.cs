using MediatR;

namespace GrammarService.Application.Features.GrammarBand.Commands.DeleteGrammarBand;

public sealed record DeleteGrammarBandCommand(
    Guid Id
) : IRequest<bool>;