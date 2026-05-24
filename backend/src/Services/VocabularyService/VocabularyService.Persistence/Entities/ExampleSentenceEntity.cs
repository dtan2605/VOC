using System.ComponentModel.DataAnnotations;

namespace VocabularyService.Persistence.Entities;

public sealed class ExampleSentenceEntity
{
    [Key]
    public int Id { get; set; }

    public int VocabularyId { get; set; }
    public VocabularyEntity? Vocabulary { get; set; }

    [Required]
    [MaxLength(500)]
    public string EnglishText { get; set; } = string.Empty;

    [MaxLength(500)]
    public string VietnameseMeaning { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }
}
