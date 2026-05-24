namespace VocabularyService.API.Dtos;

public sealed class TopicDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string ColorHex { get; init; } = string.Empty;
    public int VocabularyCount { get; init; }
}

public sealed class UpsertTopicRequest
{
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string ColorHex { get; init; } = string.Empty;
}
