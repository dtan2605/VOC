namespace LearningService.API.Models;

public sealed class JwtSettings
{
    public string Issuer { get; init; } = "VOC.AuthService";
    public string Audience { get; init; } = "VOC.Client";
    public string Secret { get; init; } = "ReplaceThisWithASecureLongRandomSecretAtDeployTime";
    public string AllowedOrigins { get; init; } = "http://localhost:3000,http://localhost:5173,http://localhost";
}
