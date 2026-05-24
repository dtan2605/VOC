using System.ComponentModel.DataAnnotations;

namespace VocabularyService.Persistence.Entities;

public sealed class TopicEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(400)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string ColorHex { get; set; } = "#C51E3A";

    public ICollection<VocabularyEntity> Vocabularies { get; set; } = new List<VocabularyEntity>();
}
