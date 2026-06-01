namespace VocabularyService.API.Dtos;

public sealed class VocabularyAiSuggestRequest
{
    public string Word { get; init; } = string.Empty;
}

public sealed class VocabularyAiSuggestResponse
{
    public string Word { get; init; } = string.Empty;
    public string Meaning { get; init; } = string.Empty;
    public IReadOnlyCollection<string> MeaningCandidates { get; init; } = Array.Empty<string>();
    public string PartOfSpeech { get; init; } = string.Empty;
    public string Pronunciation { get; init; } = string.Empty;
    public string Lemma { get; init; } = string.Empty;
    public string EnglishDefinition { get; init; } = string.Empty;
    public string ProviderSummary { get; init; } = string.Empty;
    public IReadOnlyCollection<RelatedWordFormDto> RelatedForms { get; init; } = Array.Empty<RelatedWordFormDto>();
    public IReadOnlyCollection<string> Synonyms { get; init; } = Array.Empty<string>();
    public IReadOnlyCollection<UpsertExampleSentenceRequest> Examples { get; init; } = Array.Empty<UpsertExampleSentenceRequest>();
    public int? BandLevel { get; init; }
    public string? TopicName { get; init; }
    // Confidence scores from AI for suggested band/topic (0.0 - 1.0)
    public double? BandConfidence { get; init; }
    public double? TopicConfidence { get; init; }
}

public sealed class RelatedWordFormDto
{
    public string Word { get; init; } = string.Empty;
    public string PartOfSpeech { get; init; } = string.Empty;
}
