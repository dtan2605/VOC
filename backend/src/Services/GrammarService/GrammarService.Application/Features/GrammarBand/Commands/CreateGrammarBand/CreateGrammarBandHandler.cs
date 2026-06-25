using GrammarService.Domain.Entities;
using GrammarService.Domain.Interfaces;
using MediatR;

namespace GrammarService.Application.Features.GrammarBand.Commands.CreateGrammarBand;

public sealed class CreateGrammarBandHandler
    : IRequestHandler<CreateGrammarBandCommand, Guid>
{
    private readonly IGrammarBandRepository _repository;

    public CreateGrammarBandHandler(
        IGrammarBandRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> Handle(
        CreateGrammarBandCommand request,
        CancellationToken cancellationToken)
    {
        var band = new GrammarService.Domain.Entities.GrammarBand
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Order = request.Order,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(band);

        await _repository.SaveChangesAsync();

        return band.Id;
    }
}