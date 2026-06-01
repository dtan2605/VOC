using System.ComponentModel.DataAnnotations;

namespace LearningService.Persistence.Entities;

public sealed class ReviewHistoryEntity
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    public int LearningSessionId { get; set; }
    public LearningSessionEntity? LearningSession { get; set; }

    public int VocabularyId { get; set; }

    [Required]
    [MaxLength(30)]
    public string Direction { get; set; } = "en_to_vi";

    [Required]
    [MaxLength(500)]
    public string UserAnswer { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string ExpectedAnswer { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    [Required]
    [MaxLength(30)]
    public string Result { get; set; } = "hard";

    public int ScoreSnapshot { get; set; }

    public int SecondsSpent { get; set; }

    public DateTime ReviewedAtUtc { get; set; } = DateTime.UtcNow;
}
