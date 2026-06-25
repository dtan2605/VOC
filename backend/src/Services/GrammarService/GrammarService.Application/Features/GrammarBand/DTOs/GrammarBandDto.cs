namespace GrammarService.Application.Features.GrammarBand.DTOs;

public sealed class GrammarBandDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int Order { get; set; }
}