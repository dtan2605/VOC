using System.ComponentModel.DataAnnotations;

namespace UserService.Persistence.Entities;

public sealed class UserProfileEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public string Roles { get; set; } = string.Empty;

    [MaxLength(512)]
    public string? AvatarPath { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
