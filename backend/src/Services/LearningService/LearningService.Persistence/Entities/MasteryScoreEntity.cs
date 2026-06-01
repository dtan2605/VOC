using System.ComponentModel.DataAnnotations;

namespace LearningService.Persistence.Entities;

public sealed class MasteryScoreEntity
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    public int VocabularyId { get; set; }

    public double Score { get; set; }

    public int ReviewCount { get; set; }

    public int SuccessCount { get; set; }

    public int CurrentStreak { get; set; }

    public DateTime? LastReviewedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
