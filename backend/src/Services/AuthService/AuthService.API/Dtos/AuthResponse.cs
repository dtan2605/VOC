namespace AuthService.API.Dtos;

public sealed class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresInSeconds { get; set; }
    public string RefreshToken { get; set; } = string.Empty;
}
