using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using LearningService.API.Dtos;
using LearningService.API.Models;
using LearningService.Persistence;
using LearningService.Persistence.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningService.API.Controllers;

[Authorize]
[ApiController]
[Route("api/learning")]
public sealed class LearningController : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly LearningDbContext _dbContext;
    private readonly IHttpClientFactory _httpClientFactory;

    public LearningController(LearningDbContext dbContext, IHttpClientFactory httpClientFactory)
    {
        _dbContext = dbContext;
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost("sessions")]
    public async Task<ActionResult<LearningSessionDetailDto>> StartSession([FromBody] StartLearningSessionRequest request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var normalizedMode = NormalizeMode(request.Mode);
        if (normalizedMode is null)
        {
            return BadRequest("Mode must be 'mixed', 'band', or 'topic'.");
        }

        if (normalizedMode == "band" && !request.BandId.HasValue)
        {
            return BadRequest("BandId is required for band mode.");
        }

        if (normalizedMode == "topic" && !request.TopicId.HasValue)
        {
            return BadRequest("TopicId is required for topic mode.");
        }

        var normalizedDirection = NormalizeDirection(request.Direction);
        if (normalizedDirection is null)
        {
            return BadRequest("Direction must be 'en_to_vi' or 'vi_to_en'.");
        }

        var vocabularyItems = await GetVocabularyLibraryAsync();
        if (request.BandId.HasValue)
        {
            vocabularyItems = vocabularyItems.Where(x => x.BandId == request.BandId.Value).ToList();
        }

        if (request.TopicId.HasValue)
        {
            vocabularyItems = vocabularyItems.Where(x => x.TopicId == request.TopicId.Value).ToList();
        }

        if (vocabularyItems.Count == 0)
        {
            return BadRequest("No vocabulary is available for the selected learning scope.");
        }

        var itemCount = Math.Clamp(request.ItemCount, 4, 20);
        var masteryMap = await _dbContext.MasteryScores
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .ToDictionaryAsync(x => x.VocabularyId, x => x);

        var randomized = vocabularyItems
            .OrderBy(x => masteryMap.TryGetValue(x.Id, out var mastery) ? mastery.Score : 0)
            .ThenBy(_ => Guid.NewGuid())
            .Take(itemCount)
            .ToList();

        var session = new LearningSessionEntity
        {
            UserId = userId,
            Mode = normalizedMode,
            Direction = normalizedDirection,
            BandId = request.BandId,
            TopicId = request.TopicId,
            TotalItems = randomized.Count,
            CompletedItems = 0,
            CurrentStreak = 0,
            BestStreak = 0,
            Status = "active",
            VocabularyIdsJson = JsonSerializer.Serialize(randomized.Select(x => x.Id).ToArray(), JsonOptions),
            StartedAtUtc = DateTime.UtcNow
        };

        _dbContext.LearningSessions.Add(session);
        await _dbContext.SaveChangesAsync();

        // session created; analytics events are emitted when reviews are submitted.

        var detail = await BuildSessionDetailAsync(session, userId, randomized, Array.Empty<ReviewHistoryEntity>(), masteryMap);
        return CreatedAtAction(nameof(GetSession), new { sessionId = session.Id }, detail);
    }

    [HttpGet("sessions/{sessionId:int}")]
    public async Task<ActionResult<LearningSessionDetailDto>> GetSession(int sessionId)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var session = await _dbContext.LearningSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.UserId == userId);

        if (session is null)
        {
            return NotFound("Learning session not found.");
        }

        var vocabularyIds = DeserializeVocabularyIds(session.VocabularyIdsJson);
        var vocabularyIdList = vocabularyIds.ToList();
        var vocabularyMap = await GetVocabularyMapAsync(vocabularyIds);
        var reviews = await _dbContext.ReviewHistory
            .AsNoTracking()
            .Where(x => x.LearningSessionId == session.Id)
            .ToListAsync();
        var masteryMap = await _dbContext.MasteryScores
            .AsNoTracking()
            .Where(x => x.UserId == userId && vocabularyIdList.Contains(x.VocabularyId))
            .ToDictionaryAsync(x => x.VocabularyId, x => x);

        var orderedVocabulary = vocabularyIds
            .Where(vocabularyMap.ContainsKey)
            .Select(id => vocabularyMap[id])
            .ToList();

        return Ok(await BuildSessionDetailAsync(session, userId, orderedVocabulary, reviews, masteryMap));
    }

    [HttpPost("sessions/{sessionId:int}/reviews")]
    public async Task<ActionResult<SubmitReviewResponse>> SubmitReview(int sessionId, [FromBody] SubmitReviewRequest request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var session = await _dbContext.LearningSessions
            .Include(x => x.Reviews)
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.UserId == userId);

        if (session is null)
        {
            return NotFound("Learning session not found.");
        }

        var vocabularyIds = DeserializeVocabularyIds(session.VocabularyIdsJson);
        var vocabularyIdList = vocabularyIds.ToList();
        if (!vocabularyIds.Contains(request.VocabularyId))
        {
            return BadRequest("This vocabulary item does not belong to the selected session.");
        }

        if (session.Reviews.Any(x => x.VocabularyId == request.VocabularyId))
        {
            return Conflict("This vocabulary item was already reviewed in the current session.");
        }

        var vocabulary = await GetVocabularyByIdAsync(request.VocabularyId);
        if (vocabulary is null)
        {
            return NotFound("Vocabulary item could not be loaded.");
        }

        var expectedAnswer = GetExpectedAnswer(vocabulary, session.Direction);
        var isCorrect = ValidateAnswer(request.UserAnswer, expectedAnswer, session.Direction);
        var normalizedResult = isCorrect ? "correct" : "incorrect";

        var mastery = await _dbContext.MasteryScores
            .FirstOrDefaultAsync(x => x.UserId == userId && x.VocabularyId == request.VocabularyId);

        if (mastery is null)
        {
            mastery = new MasteryScoreEntity
            {
                UserId = userId,
                VocabularyId = request.VocabularyId,
                Score = 0,
                CreatedAtUtc = DateTime.UtcNow
            };

            _dbContext.MasteryScores.Add(mastery);
        }

        var updatedScore = CalculateUpdatedScore(mastery.Score, isCorrect);
        mastery.Score = updatedScore;
        mastery.ReviewCount += 1;
        mastery.SuccessCount += isCorrect ? 1 : 0;
        mastery.CurrentStreak = isCorrect ? mastery.CurrentStreak + 1 : 0;
        mastery.LastReviewedAtUtc = DateTime.UtcNow;
        mastery.UpdatedAtUtc = DateTime.UtcNow;

        session.CurrentStreak = isCorrect ? session.CurrentStreak + 1 : 0;
        session.BestStreak = Math.Max(session.BestStreak, session.CurrentStreak);

        var review = new ReviewHistoryEntity
        {
            UserId = userId,
            LearningSessionId = session.Id,
            VocabularyId = request.VocabularyId,
            Direction = session.Direction,
            UserAnswer = request.UserAnswer.Trim(),
            ExpectedAnswer = expectedAnswer,
            IsCorrect = isCorrect,
            Result = normalizedResult,
            ScoreSnapshot = (int)Math.Round(updatedScore),
            SecondsSpent = Math.Max(request.SecondsSpent, 0),
            ReviewedAtUtc = DateTime.UtcNow
        };

        _dbContext.ReviewHistory.Add(review);

        session.CompletedItems = Math.Min(session.TotalItems, session.CompletedItems + 1);
        if (session.CompletedItems >= session.TotalItems)
        {
            session.Status = "completed";
            session.CompletedAtUtc = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync();

        var vocabularyMap = await GetVocabularyMapAsync(vocabularyIds);
        var masteryMap = await _dbContext.MasteryScores
            .AsNoTracking()
            .Where(x => x.UserId == userId && vocabularyIdList.Contains(x.VocabularyId))
            .ToDictionaryAsync(x => x.VocabularyId, x => x);
        var reviews = await _dbContext.ReviewHistory
            .AsNoTracking()
            .Where(x => x.LearningSessionId == session.Id)
            .ToListAsync();

        var orderedItems = vocabularyIds
            .Where(vocabularyMap.ContainsKey)
            .Select(id => BuildCard(vocabularyMap[id], session.Direction, masteryMap.GetValueOrDefault(id), reviews.FirstOrDefault(x => x.VocabularyId == id)))
            .ToList();

        var nextItem = orderedItems.FirstOrDefault(x => !x.ReviewedInSession);

        return Ok(new SubmitReviewResponse
        {
            SessionId = session.Id,
            CompletedItems = session.CompletedItems,
            TotalItems = session.TotalItems,
            SessionCompleted = session.Status == "completed",
            UpdatedMasteryScore = updatedScore,
            IsCorrect = isCorrect,
            ExpectedAnswer = expectedAnswer,
            UserAnswer = request.UserAnswer.Trim(),
            CurrentStreak = session.CurrentStreak,
            BestStreak = session.BestStreak,
            NextItem = nextItem
        });
    }

    [HttpGet("progress")]
    public async Task<ActionResult<LearningProgressResponse>> GetProgress()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var allVocabulary = await GetVocabularyLibraryAsync();
        var vocabularyMap = allVocabulary.ToDictionary(x => x.Id);

        var sessions = await _dbContext.LearningSessions
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.StartedAtUtc)
            .ToListAsync();

        var reviews = await _dbContext.ReviewHistory
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.ReviewedAtUtc)
            .ToListAsync();

        var masteryScores = await _dbContext.MasteryScores
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .ToListAsync();

        var overview = new ProgressOverviewDto
        {
            TotalSessions = sessions.Count,
            ActiveSessions = sessions.Count(x => x.Status == "active"),
            TotalReviews = reviews.Count,
            MasteredWords = masteryScores.Count(x => x.Score >= 80),
            WordsInProgress = masteryScores.Count(x => x.Score > 0 && x.Score < 80),
            AverageMasteryScore = masteryScores.Count == 0 ? 0 : Math.Round(masteryScores.Average(x => x.Score), 1),
            CurrentStudyStreakDays = CalculateStudyStreak(reviews.Select(x => x.ReviewedAtUtc)),
            BestAnswerStreak = sessions.Count == 0 ? 0 : sessions.Max(x => x.BestStreak)
        };

        var recentSessions = sessions
            .Take(6)
            .Select(MapSessionSummary)
            .ToArray();

        var recentReviews = reviews
            .Take(10)
            .Where(x => vocabularyMap.ContainsKey(x.VocabularyId))
            .Select(x => MapReviewHistory(x, vocabularyMap[x.VocabularyId]))
            .ToArray();

        var masteryMap = masteryScores.ToDictionary(x => x.VocabularyId);

        var bandProgress = allVocabulary
            .GroupBy(x => new { x.BandId, x.BandName })
            .Select(group =>
            {
                var bandMastery = group
                    .Select(x => masteryMap.GetValueOrDefault(x.Id))
                    .Where(x => x is not null)
                    .Select(x => x!)
                    .ToList();

                return new BandLearningProgressDto
                {
                    BandId = group.Key.BandId,
                    BandName = group.Key.BandName,
                    TotalWords = group.Count(),
                    ReviewedWords = bandMastery.Count,
                    MasteredWords = bandMastery.Count(x => x.Score >= 80),
                    AverageMasteryScore = bandMastery.Count == 0 ? 0 : Math.Round(bandMastery.Average(x => x.Score), 1)
                };
            })
            .OrderBy(x => x.BandName)
            .ToArray();

        var topicProgress = allVocabulary
            .GroupBy(x => new { x.TopicId, x.TopicName, x.TopicColorHex })
            .Select(group =>
            {
                var topicMastery = group
                    .Select(x => masteryMap.GetValueOrDefault(x.Id))
                    .Where(x => x is not null)
                    .Select(x => x!)
                    .ToList();

                return new TopicLearningProgressDto
                {
                    TopicId = group.Key.TopicId,
                    TopicName = group.Key.TopicName,
                    ColorHex = group.Key.TopicColorHex,
                    TotalWords = group.Count(),
                    ReviewedWords = topicMastery.Count,
                    MasteredWords = topicMastery.Count(x => x.Score >= 80),
                    AverageMasteryScore = topicMastery.Count == 0 ? 0 : Math.Round(topicMastery.Average(x => x.Score), 1)
                };
            })
            .OrderBy(x => x.TopicName)
            .ToArray();

        var focusWords = allVocabulary
            .Where(x => masteryMap.TryGetValue(x.Id, out var mastery) && mastery.Score < 80)
            .OrderBy(x => masteryMap[x.Id].Score)
            .ThenByDescending(x => masteryMap[x.Id].LastReviewedAtUtc)
            .Take(8)
            .Select(x => BuildCard(x, "en_to_vi", masteryMap.GetValueOrDefault(x.Id), null))
            .ToArray();

        return Ok(new LearningProgressResponse
        {
            Overview = overview,
            RecentSessions = recentSessions,
            RecentReviews = recentReviews,
            BandProgress = bandProgress,
            TopicProgress = topicProgress,
            FocusWords = focusWords
        });
    }

    [HttpGet("history")]
    public async Task<ActionResult<PagedResult<ReviewHistoryItemDto>>> GetReviewHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.ReviewHistory
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.ReviewedAtUtc);

        var totalItems = await query.CountAsync();
        var reviewPage = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var vocabularyMap = await GetVocabularyMapAsync(reviewPage.Select(x => x.VocabularyId).Distinct().ToArray());
        var items = reviewPage
            .Where(x => vocabularyMap.ContainsKey(x.VocabularyId))
            .Select(x => MapReviewHistory(x, vocabularyMap[x.VocabularyId]))
            .ToArray();

        return Ok(new PagedResult<ReviewHistoryItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    private async Task<LearningSessionDetailDto> BuildSessionDetailAsync(
        LearningSessionEntity session,
        int userId,
        IReadOnlyCollection<VocabularyListItem> vocabularyItems,
        IReadOnlyCollection<ReviewHistoryEntity> reviews,
        IReadOnlyDictionary<int, MasteryScoreEntity> masteryMap)
    {
        var cards = vocabularyItems
            .Select(item => BuildCard(item, session.Direction, masteryMap.GetValueOrDefault(item.Id), reviews.FirstOrDefault(x => x.VocabularyId == item.Id)))
            .ToArray();

        var nextItem = cards.FirstOrDefault(x => !x.ReviewedInSession);

        return await Task.FromResult(new LearningSessionDetailDto
        {
            Session = MapSessionSummary(session),
            Items = cards,
            NextItem = nextItem
        });
    }

    private LearningVocabularyCardDto BuildCard(
        VocabularyListItem vocabulary,
        string direction,
        MasteryScoreEntity? mastery,
        ReviewHistoryEntity? review)
    {
        return new LearningVocabularyCardDto
        {
            VocabularyId = vocabulary.Id,
            Word = vocabulary.Word,
            Meaning = vocabulary.Meaning,
            PartOfSpeech = vocabulary.PartOfSpeech,
            Pronunciation = vocabulary.Pronunciation,
            BandId = vocabulary.BandId,
            BandName = vocabulary.BandName,
            TopicId = vocabulary.TopicId,
            TopicName = vocabulary.TopicName,
            TopicColorHex = vocabulary.TopicColorHex,
            ExampleCount = vocabulary.Examples.Count,
            ExamplePreview = vocabulary.Examples.FirstOrDefault()?.EnglishText ?? string.Empty,
            MasteryScore = Math.Round(mastery?.Score ?? 0, 1),
            ReviewedInSession = review is not null,
            SessionResult = review?.Result,
            PromptText = GetPromptText(vocabulary, direction),
            PromptLabel = GetPromptLabel(direction),
            AnswerPlaceholder = GetAnswerPlaceholder(direction)
        };
    }

    private static LearningSessionSummaryDto MapSessionSummary(LearningSessionEntity session)
    {
        return new LearningSessionSummaryDto
        {
            Id = session.Id,
            Mode = session.Mode,
            Direction = session.Direction,
            BandId = session.BandId,
            TopicId = session.TopicId,
            TotalItems = session.TotalItems,
            CompletedItems = session.CompletedItems,
            CurrentStreak = session.CurrentStreak,
            BestStreak = session.BestStreak,
            Status = session.Status,
            StartedAtUtc = session.StartedAtUtc,
            CompletedAtUtc = session.CompletedAtUtc
        };
    }

    private static ReviewHistoryItemDto MapReviewHistory(ReviewHistoryEntity review, VocabularyListItem vocabulary)
    {
        return new ReviewHistoryItemDto
        {
            Id = review.Id,
            SessionId = review.LearningSessionId,
            VocabularyId = review.VocabularyId,
            Word = vocabulary.Word,
            Meaning = vocabulary.Meaning,
            BandName = vocabulary.BandName,
            TopicName = vocabulary.TopicName,
            Direction = review.Direction,
            UserAnswer = review.UserAnswer,
            ExpectedAnswer = review.ExpectedAnswer,
            IsCorrect = review.IsCorrect,
            Result = review.Result,
            ScoreSnapshot = review.ScoreSnapshot,
            SecondsSpent = review.SecondsSpent,
            ReviewedAtUtc = review.ReviewedAtUtc
        };
    }

    private bool TryGetUserId(out int userId)
    {
        userId = 0;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return !string.IsNullOrWhiteSpace(userIdClaim) && int.TryParse(userIdClaim, out userId);
    }

    private static string? NormalizeMode(string? mode)
    {
        return mode?.Trim().ToLowerInvariant() switch
        {
            "mixed" => "mixed",
            "band" => "band",
            "topic" => "topic",
            _ => null
        };
    }

    private static string? NormalizeResult(string? result)
    {
        return result?.Trim().ToLowerInvariant() switch
        {
            "correct" => "correct",
            "incorrect" => "incorrect",
            _ => null
        };
    }

    private static string? NormalizeDirection(string? direction)
    {
        return direction?.Trim().ToLowerInvariant() switch
        {
            "en_to_vi" => "en_to_vi",
            "vi_to_en" => "vi_to_en",
            _ => null
        };
    }

    private static double CalculateUpdatedScore(double currentScore, bool isCorrect)
    {
        var targetScore = isCorrect ? 82 : 18;

        return Math.Round((currentScore * 0.65) + (targetScore * 0.35), 1);
    }

    private static string GetExpectedAnswer(VocabularyListItem vocabulary, string direction)
    {
        return direction == "vi_to_en" ? vocabulary.Word : vocabulary.Meaning;
    }

    private static bool ValidateAnswer(string userAnswer, string expectedAnswer, string direction)
    {
        var normalizedUser = NormalizeText(userAnswer);
        var normalizedExpected = NormalizeText(expectedAnswer);

        if (string.IsNullOrWhiteSpace(normalizedUser) || string.IsNullOrWhiteSpace(normalizedExpected))
        {
            return false;
        }

        if (direction == "vi_to_en")
        {
            return normalizedUser == normalizedExpected;
        }

        return normalizedUser == normalizedExpected ||
               normalizedExpected.Contains(normalizedUser, StringComparison.Ordinal) ||
               normalizedUser.Contains(normalizedExpected, StringComparison.Ordinal);
    }

    private static string NormalizeText(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var filteredChars = text
            .Trim()
            .ToLowerInvariant()
            .Where(char.IsLetterOrDigit)
            .ToArray();

        return new string(filteredChars);
    }

    private static string GetPromptText(VocabularyListItem vocabulary, string direction)
    {
        return direction == "vi_to_en" ? vocabulary.Meaning : vocabulary.Word;
    }

    private static string GetPromptLabel(string direction)
    {
        return direction == "vi_to_en" ? "Vietnamese to English" : "English to Vietnamese";
    }

    private static string GetAnswerPlaceholder(string direction)
    {
        return direction == "vi_to_en" ? "Type the English word" : "Type the Vietnamese meaning";
    }

    private static int CalculateStudyStreak(IEnumerable<DateTime> reviewedAtUtc)
    {
        var distinctDays = reviewedAtUtc
            .Select(x => DateOnly.FromDateTime(x))
            .Distinct()
            .OrderByDescending(x => x)
            .ToList();

        if (distinctDays.Count == 0)
        {
            return 0;
        }

        var streak = 0;
        var current = DateOnly.FromDateTime(DateTime.UtcNow);
        if (distinctDays[0] != current && distinctDays[0] != current.AddDays(-1))
        {
            return 0;
        }

        var cursor = distinctDays[0];
        foreach (var day in distinctDays)
        {
            if (day == cursor)
            {
                streak += 1;
                cursor = cursor.AddDays(-1);
                continue;
            }

            break;
        }

        return streak;
    }

    private static int[] DeserializeVocabularyIds(string vocabularyIdsJson)
    {
        return JsonSerializer.Deserialize<int[]>(vocabularyIdsJson, JsonOptions) ?? Array.Empty<int>();
    }

    private async Task<Dictionary<int, VocabularyListItem>> GetVocabularyMapAsync(IEnumerable<int> vocabularyIds)
    {
        var ids = vocabularyIds.Distinct().ToArray();
        var cards = await Task.WhenAll(ids.Select(GetVocabularyByIdAsync));
        return cards
            .Where(x => x is not null)
            .Select(x => x!)
            .ToDictionary(x => x.Id);
    }

    private async Task<VocabularyListItem?> GetVocabularyByIdAsync(int vocabularyId)
    {
        var client = CreateVocabularyClient();
        using var response = await client.GetAsync($"/api/vocabulary/{vocabularyId}");
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        await using var stream = await response.Content.ReadAsStreamAsync();
        var item = await JsonSerializer.DeserializeAsync<VocabularyDetailResponse>(stream, JsonOptions);
        return item is null ? null : MapVocabulary(item);
    }

    private async Task<List<VocabularyListItem>> GetVocabularyLibraryAsync()
    {
        var client = CreateVocabularyClient();
        var items = new List<VocabularyListItem>();
        var page = 1;
        int totalPages;

        do
        {
            using var response = await client.GetAsync($"/api/vocabulary?page={page}&pageSize=100");
            response.EnsureSuccessStatusCode();
            await using var stream = await response.Content.ReadAsStreamAsync();
            var pageResult = await JsonSerializer.DeserializeAsync<PagedVocabularyResponse>(stream, JsonOptions)
                ?? new PagedVocabularyResponse();

            items.AddRange(pageResult.Items.Select(MapVocabulary));
            totalPages = Math.Max(pageResult.TotalPages, 1);
            page += 1;
        } while (page <= totalPages);

        var topics = await GetTopicsAsync(client);
        foreach (var item in items)
        {
            if (topics.TryGetValue(item.TopicId, out var topic))
            {
                item.TopicColorHex = topic.ColorHex;
            }
        }

        return items;
    }

    private async Task<Dictionary<int, TopicLookupDto>> GetTopicsAsync(HttpClient client)
    {
        using var response = await client.GetAsync("/api/topics?page=1&pageSize=100");
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync();
        var pageResult = await JsonSerializer.DeserializeAsync<PagedTopicResponse>(stream, JsonOptions)
            ?? new PagedTopicResponse();

        return pageResult.Items.ToDictionary(x => x.Id);
    }

    private HttpClient CreateVocabularyClient()
    {
        var client = _httpClientFactory.CreateClient("vocabulary-service");
        if (Request.Headers.Authorization.Count > 0)
        {
            client.DefaultRequestHeaders.Authorization = AuthenticationHeaderValue.Parse(Request.Headers.Authorization.ToString());
        }

        return client;
    }

    private static VocabularyListItem MapVocabulary(VocabularyDetailResponse item)
    {
        return new VocabularyListItem
        {
            Id = item.Id,
            Word = item.Word,
            Meaning = item.Meaning,
            PartOfSpeech = item.PartOfSpeech,
            Pronunciation = item.Pronunciation,
            BandId = item.BandId,
            BandName = item.BandName,
            TopicId = item.TopicId,
            TopicName = item.TopicName,
            Examples = item.Examples ?? new List<VocabularyExampleResponse>()
        };
    }

    private sealed class VocabularyListItem
    {
        public int Id { get; init; }
        public string Word { get; init; } = string.Empty;
        public string Meaning { get; init; } = string.Empty;
        public string PartOfSpeech { get; init; } = string.Empty;
        public string Pronunciation { get; init; } = string.Empty;
        public int BandId { get; init; }
        public string BandName { get; init; } = string.Empty;
        public int TopicId { get; init; }
        public string TopicName { get; init; } = string.Empty;
        public string TopicColorHex { get; set; } = "#C51E3A";
        public IReadOnlyCollection<VocabularyExampleResponse> Examples { get; init; } = Array.Empty<VocabularyExampleResponse>();
    }

    private sealed class PagedVocabularyResponse
    {
        public List<VocabularyDetailResponse> Items { get; init; } = new();
        public int TotalPages { get; init; }
    }

    private sealed class PagedTopicResponse
    {
        public List<TopicLookupDto> Items { get; init; } = new();
    }

    private sealed class TopicLookupDto
    {
        public int Id { get; init; }
        public string ColorHex { get; init; } = "#C51E3A";
    }

    private sealed class VocabularyDetailResponse
    {
        public int Id { get; init; }
        public string Word { get; init; } = string.Empty;
        public string Meaning { get; init; } = string.Empty;
        public string PartOfSpeech { get; init; } = string.Empty;
        public string Pronunciation { get; init; } = string.Empty;
        public int BandId { get; init; }
        public string BandName { get; init; } = string.Empty;
        public int TopicId { get; init; }
        public string TopicName { get; init; } = string.Empty;
        public List<VocabularyExampleResponse>? Examples { get; init; }
    }

    private sealed class VocabularyExampleResponse
    {
        public string EnglishText { get; init; } = string.Empty;
    }
}
