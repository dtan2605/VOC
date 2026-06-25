using GrammarService.Domain.Common;
using GrammarService.Domain.Enums;

namespace GrammarService.Domain.Entities;

public class GrammarExercise : BaseEntity
{
    public Guid LessonId { get; set; }

    public GrammarExerciseType Type { get; set; }

    public string Question { get; set; } = string.Empty;

    public string Explanation { get; set; } = string.Empty;

    public int Difficulty { get; set; }

    public GrammarLesson Lesson { get; set; } = null!;

    public ICollection<GrammarAnswer> Answers { get; set; }
        = new List<GrammarAnswer>();
}