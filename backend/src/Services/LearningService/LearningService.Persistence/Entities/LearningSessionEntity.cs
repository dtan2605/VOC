using System.ComponentModel.DataAnnotations;

namespace LearningService.Persistence.Entities;

public sealed class LearningSessionEntity
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Mode { get; set; } = "mixed";

    [Required]
    [MaxLength(30)]
    public string Direction { get; set; } = "en_to_vi";

    public int? BandId { get; set; }

    public int? TopicId { get; set; }

    public int TotalItems { get; set; }

    public int CompletedItems { get; set; }

    public int CurrentStreak { get; set; }

    public int BestStreak { get; set; }

    [Required]
    [MaxLength(40)]
    public string Status { get; set; } = "active";

    [Required]
    public string VocabularyIdsJson { get; set; } = "[]";

    public DateTime StartedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAtUtc { get; set; }

    public ICollection<ReviewHistoryEntity> Reviews { get; set; } = new List<ReviewHistoryEntity>();
}
