using GrammarService.Domain.Entities;

namespace GrammarService.Domain.Interfaces;

public interface IGrammarBandRepository
{
    Task<List<GrammarBand>> GetAllAsync();

    Task<GrammarBand?> GetByIdAsync(Guid id);

    Task AddAsync(GrammarBand band);

    void Update(GrammarBand band);

    void Delete(GrammarBand band);

    Task SaveChangesAsync();
}