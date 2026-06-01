namespace VocabularyService.API.Models;

public sealed class AiServiceSettings
{
    public string NlpServiceBaseUrl { get; init; } = "http://localhost:8001";
    public string TranslationServiceBaseUrl { get; init; } = "http://localhost:8002";
}
