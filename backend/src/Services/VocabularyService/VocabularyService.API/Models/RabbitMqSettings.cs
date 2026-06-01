namespace VocabularyService.API.Models;

public sealed class RabbitMqSettings
{
    public string Host { get; init; } = string.Empty;
    public int Port { get; init; } = 5672;
    public string Username { get; init; } = "guest";
    public string Password { get; init; } = "guest";
    public string Exchange { get; init; } = "voc.ai";
}
