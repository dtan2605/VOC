namespace VocabularyService.API.Models;

public sealed class JwtSettings
{
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
    public string AllowedOrigins { get; set; } = "http://localhost:3000";
}
