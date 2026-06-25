using GrammarService.Domain.Interfaces;
using MediatR;

namespace GrammarService.Application.Features.GrammarBand.Commands.UpdateGrammarBand;

public sealed class UpdateGrammarBandHandler
    : IRequestHandler<UpdateGrammarBandCommand, bool>
{
    private readonly IGrammarBandRepository _repository;

    public UpdateGrammarBandHandler(
        IGrammarBandRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(
        UpdateGrammarBandCommand request,
        CancellationToken cancellationToken)
    {
        var band = await _repository.GetByIdAsync(request.Id);

        if (band is null)
            return false;

        band.Name = request.Name;
        band.Description = request.Description;
        band.Order = request.Order;
        band.UpdatedAt = DateTime.UtcNow;

        _repository.Update(band);

        await _repository.SaveChangesAsync();

        return true;
    }
}