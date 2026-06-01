using System.ComponentModel.DataAnnotations;

namespace VocabularyService.Persistence.Entities;

public sealed class VocabularyEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(120)]
    public string Word { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Meaning { get; set; } = string.Empty;

    [MaxLength(120)]
    public string PartOfSpeech { get; set; } = string.Empty;

    [MaxLength(120)]
    public string Pronunciation { get; set; } = string.Empty;

    public int? UserId { get; set; }

    public int BandId { get; set; }
    public BandEntity? Band { get; set; }

    public int TopicId { get; set; }
    public TopicEntity? Topic { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ExampleSentenceEntity> Examples { get; set; } = new List<ExampleSentenceEntity>();
}
