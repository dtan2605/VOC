using GrammarService.Domain.Common;

namespace GrammarService.Domain.Entities;

public class GrammarLesson : BaseEntity
{
    public Guid TopicId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Theory { get; set; } = string.Empty;

    public string Formula { get; set; } = string.Empty;

    public string Tips { get; set; } = string.Empty;

    public string CommonMistakes { get; set; } = string.Empty;

    public int Difficulty { get; set; }

    public GrammarTopic Topic { get; set; } = null!;

    public ICollection<GrammarExample> Examples { get; set; }
        = new List<GrammarExample>();

    public ICollection<GrammarExercise> Exercises { get; set; }
        = new List<GrammarExercise>();
}