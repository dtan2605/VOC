using System.ComponentModel.DataAnnotations;

namespace VocabularyService.Persistence.Entities;

public sealed class BandEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(400)]
    public string Description { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public ICollection<VocabularyEntity> Vocabularies { get; set; } = new List<VocabularyEntity>();
}
