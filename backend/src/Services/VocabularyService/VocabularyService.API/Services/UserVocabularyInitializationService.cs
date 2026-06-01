using Microsoft.EntityFrameworkCore;
using VocabularyService.Persistence;

namespace VocabularyService.API.Services;

public interface IUserVocabularyInitializationService
{
    /// <summary>
    /// Initialize default vocabulary, bands, and topics for a new user
    /// by cloning global default data (UserId = NULL) into user's personal space.
    /// </summary>
    Task InitializeUserVocabularyAsync(int userId, CancellationToken cancellationToken = default);
}

public sealed class UserVocabularyInitializationService : IUserVocabularyInitializationService
{
    private readonly VocabularyDbContext _dbContext;
    private readonly ILogger<UserVocabularyInitializationService> _logger;

    public UserVocabularyInitializationService(
        VocabularyDbContext dbContext,
        ILogger<UserVocabularyInitializationService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task InitializeUserVocabularyAsync(int userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Initializing vocabulary for user {UserId}", userId);

            // Call the stored procedure to initialize user vocabulary
            await _dbContext.Database.ExecuteSqlInterpolatedAsync(
                $"CALL sp_initialize_user_vocabulary({userId})",
                cancellationToken);

            _logger.LogInformation("Successfully initialized vocabulary for user {UserId}", userId);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Failed to initialize vocabulary for user {UserId}", userId);
            throw;
        }
    }
}
