namespace VocabularyService.API.Dtos;

public sealed class ExampleSentenceDto
{
    public int Id { get; init; }
    public string EnglishText { get; init; } = string.Empty;
    public string VietnameseMeaning { get; init; } = string.Empty;
    public int DisplayOrder { get; init; }
}

public sealed class VocabularyDto
{
    public int Id { get; init; }
    public string Word { get; init; } = string.Empty;
    public string Meaning { get; init; } = string.Empty;
    public string PartOfSpeech { get; init; } = string.Empty;
    public string Pronunciation { get; init; } = string.Empty;
    public int BandId { get; init; }
    public string BandName { get; init; } = string.Empty;
    public int TopicId { get; init; }
    public string TopicName { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public IReadOnlyCollection<ExampleSentenceDto> Examples { get; init; } = Array.Empty<ExampleSentenceDto>();
}

public sealed class UpsertExampleSentenceRequest
{
    public string EnglishText { get; init; } = string.Empty;
    public string VietnameseMeaning { get; init; } = string.Empty;
    public int DisplayOrder { get; init; }
}

public sealed class UpsertVocabularyRequest
{
    public string Word { get; init; } = string.Empty;
    public string Meaning { get; init; } = string.Empty;
    public string PartOfSpeech { get; init; } = string.Empty;
    public string Pronunciation { get; init; } = string.Empty;
    public int BandId { get; init; }
    public int TopicId { get; init; }
    public IReadOnlyCollection<UpsertExampleSentenceRequest> Examples { get; init; } = Array.Empty<UpsertExampleSentenceRequest>();
}
