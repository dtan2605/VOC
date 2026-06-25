using GrammarService.Domain.Common;

namespace GrammarService.Domain.Entities;

public class GrammarRule : BaseEntity
{
    public Guid LessonId { get; set; }

    public string RuleName { get; set; } = string.Empty;

    public string Pattern { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public GrammarLesson Lesson { get; set; } = null!;
}