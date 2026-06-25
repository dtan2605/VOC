using GrammarService.Domain.Common;

namespace GrammarService.Domain.Entities;

public class GrammarBand : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int Order { get; set; }

    public ICollection<GrammarTopic> Topics { get; set; }
        = new List<GrammarTopic>();
}