using GrammarService.Domain.Entities;

namespace GrammarService.Domain.Interfaces;

public interface IGrammarTopicRepository
{
    Task<List<GrammarTopic>> GetAllAsync();

    Task<GrammarTopic?> GetByIdAsync(Guid id);

    Task AddAsync(GrammarTopic topic);

    void Update(GrammarTopic topic);

    void Delete(GrammarTopic topic);

    Task SaveChangesAsync();
}