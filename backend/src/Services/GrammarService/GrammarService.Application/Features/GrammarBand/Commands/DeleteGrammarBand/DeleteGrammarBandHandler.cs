using GrammarService.Domain.Interfaces;
using MediatR;

namespace GrammarService.Application.Features.GrammarBand.Commands.DeleteGrammarBand;

public sealed class DeleteGrammarBandHandler
    : IRequestHandler<DeleteGrammarBandCommand, bool>
{
    private readonly IGrammarBandRepository _repository;

    public DeleteGrammarBandHandler(
        IGrammarBandRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(
        DeleteGrammarBandCommand request,
        CancellationToken cancellationToken)
    {
        var band = await _repository.GetByIdAsync(request.Id);

        if (band is null)
            return false;

        _repository.Delete(band);

        await _repository.SaveChangesAsync();

        return true;
    }
}