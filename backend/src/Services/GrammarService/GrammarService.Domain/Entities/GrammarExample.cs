using GrammarService.Domain.Common;

namespace GrammarService.Domain.Entities;

public class GrammarExample : BaseEntity
{
    public Guid LessonId { get; set; }

    public string EnglishSentence { get; set; } = string.Empty;

    public string VietnameseMeaning { get; set; } = string.Empty;

    public string Explanation { get; set; } = string.Empty;

    public GrammarLesson Lesson { get; set; } = null!;
}