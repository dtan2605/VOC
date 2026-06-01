using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using VocabularyService.API.Dtos;
using VocabularyService.API.Models;

namespace VocabularyService.API.Services;

public sealed class RabbitMqVocabularyAiEventPublisher : IVocabularyAiEventPublisher, IAsyncDisposable
{
    private readonly RabbitMqSettings _settings;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);
    private IConnection? _connection;
    private IChannel? _channel;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public RabbitMqVocabularyAiEventPublisher(IConfiguration configuration)
    {
        _settings = configuration.GetSection("RabbitMq").Get<RabbitMqSettings>() ?? new RabbitMqSettings();
    }

    public Task PublishSuggestionGeneratedAsync(VocabularyAiSuggestResponse suggestion, CancellationToken cancellationToken = default)
    {
        return PublishAsync("vocabulary.ai.suggestion.generated", new
        {
            suggestion.Word,
            suggestion.Meaning,
            suggestion.PartOfSpeech,
            suggestion.Pronunciation,
            suggestion.Lemma,
            suggestion.EnglishDefinition,
            suggestion.ProviderSummary,
            suggestion.Examples,
            GeneratedAtUtc = DateTime.UtcNow
        }, cancellationToken);
    }

    public Task PublishVocabularySavedAsync(VocabularyDto vocabulary, CancellationToken cancellationToken = default)
    {
        return PublishAsync("vocabulary.saved", new
        {
            vocabulary.Id,
            vocabulary.Word,
            vocabulary.Meaning,
            vocabulary.PartOfSpeech,
            vocabulary.Pronunciation,
            vocabulary.BandId,
            vocabulary.TopicId,
            vocabulary.Examples,
            SavedAtUtc = DateTime.UtcNow
        }, cancellationToken);
    }

    private async Task PublishAsync(string routingKey, object payload, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_settings.Host))
        {
            return;
        }

        try
        {
            await EnsureChannelAsync(cancellationToken);
            if (_channel is null)
            {
                return;
            }

            var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload, _jsonOptions));
            await _channel.BasicPublishAsync(
                exchange: _settings.Exchange,
                routingKey: routingKey,
                mandatory: false,
                body: body,
                cancellationToken: cancellationToken);
        }
        catch
        {
            // RabbitMQ is used as best-effort async integration for phase 4.1.
        }
    }

    private async Task EnsureChannelAsync(CancellationToken cancellationToken)
    {
        if (_channel is not null)
        {
            return;
        }

        await _lock.WaitAsync(cancellationToken);
        try
        {
            if (_channel is not null)
            {
                return;
            }

            var factory = new ConnectionFactory
            {
                HostName = _settings.Host,
                Port = _settings.Port,
                UserName = _settings.Username,
                Password = _settings.Password
            };

            _connection = await factory.CreateConnectionAsync(cancellationToken);
            _channel = await _connection.CreateChannelAsync(cancellationToken: cancellationToken);
            await _channel.ExchangeDeclareAsync(
                exchange: _settings.Exchange,
                type: ExchangeType.Topic,
                durable: true,
                autoDelete: false,
                cancellationToken: cancellationToken);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel is not null)
        {
            await _channel.DisposeAsync();
        }

        if (_connection is not null)
        {
            await _connection.DisposeAsync();
        }

        _lock.Dispose();
    }
}
