namespace AuthService.API.Models;

public sealed class RefreshToken
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRevoked { get; set; }
    public bool IsExpired => ExpiresAt <= DateTime.UtcNow;
}
