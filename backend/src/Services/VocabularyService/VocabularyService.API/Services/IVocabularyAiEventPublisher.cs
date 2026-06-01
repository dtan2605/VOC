using VocabularyService.API.Dtos;

namespace VocabularyService.API.Services;

public interface IVocabularyAiEventPublisher
{
    Task PublishSuggestionGeneratedAsync(VocabularyAiSuggestResponse suggestion, CancellationToken cancellationToken = default);
    Task PublishVocabularySavedAsync(VocabularyDto vocabulary, CancellationToken cancellationToken = default);
}
