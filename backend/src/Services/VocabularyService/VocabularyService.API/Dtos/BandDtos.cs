namespace VocabularyService.API.Dtos;

public sealed class BandDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public int SortOrder { get; init; }
    public int VocabularyCount { get; init; }
}

public sealed class UpsertBandRequest
{
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public int SortOrder { get; init; }
}
