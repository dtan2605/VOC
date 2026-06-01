using VocabularyService.API.Dtos;

namespace VocabularyService.API.Services;

public interface IVocabularyAiService
{
    Task<VocabularyAiSuggestResponse> SuggestAsync(string word, CancellationToken cancellationToken = default);
}
