using GrammarService.Domain.Common;

namespace GrammarService.Domain.Entities;

public class GrammarAnswer : BaseEntity
{
    public Guid ExerciseId { get; set; }

    public string Answer { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public GrammarExercise Exercise { get; set; } = null!;
}