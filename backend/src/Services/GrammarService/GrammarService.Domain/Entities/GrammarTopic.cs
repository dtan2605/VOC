using GrammarService.Domain.Common;

namespace GrammarService.Domain.Entities;

public class GrammarTopic : BaseEntity
{
    public Guid BandId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public GrammarBand Band { get; set; } = null!;

    public ICollection<GrammarLesson> Lessons { get; set; }
        = new List<GrammarLesson>();
}