namespace LearningService.API.Dtos;

public sealed class StartLearningSessionRequest
{
    public string Mode { get; init; } = "mixed";
    public string Direction { get; init; } = "en_to_vi";
    public int? BandId { get; init; }
    public int? TopicId { get; init; }
    public int ItemCount { get; init; } = 8;
}

public sealed class SubmitReviewRequest
{
    public int VocabularyId { get; init; }
    public string UserAnswer { get; init; } = string.Empty;
    public int SecondsSpent { get; init; }
}

public sealed class LearningVocabularyCardDto
{
    public int VocabularyId { get; init; }
    public string Word { get; init; } = string.Empty;
    public string Meaning { get; init; } = string.Empty;
    public string PartOfSpeech { get; init; } = string.Empty;
    public string Pronunciation { get; init; } = string.Empty;
    public string BandName { get; init; } = string.Empty;
    public string TopicName { get; init; } = string.Empty;
    public int BandId { get; init; }
    public int TopicId { get; init; }
    public string TopicColorHex { get; init; } = "#C51E3A";
    public int ExampleCount { get; init; }
    public string ExamplePreview { get; init; } = string.Empty;
    public double MasteryScore { get; init; }
    public bool ReviewedInSession { get; init; }
    public string? SessionResult { get; init; }
    public string PromptText { get; init; } = string.Empty;
    public string PromptLabel { get; init; } = string.Empty;
    public string AnswerPlaceholder { get; init; } = string.Empty;
}

public sealed class LearningSessionSummaryDto
{
    public int Id { get; init; }
    public string Mode { get; init; } = string.Empty;
    public string Direction { get; init; } = string.Empty;
    public int? BandId { get; init; }
    public int? TopicId { get; init; }
    public int TotalItems { get; init; }
    public int CompletedItems { get; init; }
    public int CurrentStreak { get; init; }
    public int BestStreak { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime StartedAtUtc { get; init; }
    public DateTime? CompletedAtUtc { get; init; }
}

public sealed class LearningSessionDetailDto
{
    public LearningSessionSummaryDto Session { get; init; } = new();
    public IReadOnlyCollection<LearningVocabularyCardDto> Items { get; init; } = Array.Empty<LearningVocabularyCardDto>();
    public LearningVocabularyCardDto? NextItem { get; init; }
}

public sealed class SubmitReviewResponse
{
    public int SessionId { get; init; }
    public int CompletedItems { get; init; }
    public int TotalItems { get; init; }
    public bool SessionCompleted { get; init; }
    public double UpdatedMasteryScore { get; init; }
    public bool IsCorrect { get; init; }
    public string ExpectedAnswer { get; init; } = string.Empty;
    public string UserAnswer { get; init; } = string.Empty;
    public int CurrentStreak { get; init; }
    public int BestStreak { get; init; }
    public LearningVocabularyCardDto? NextItem { get; init; }
}

public sealed class ReviewHistoryItemDto
{
    public int Id { get; init; }
    public int SessionId { get; init; }
    public int VocabularyId { get; init; }
    public string Word { get; init; } = string.Empty;
    public string Meaning { get; init; } = string.Empty;
    public string BandName { get; init; } = string.Empty;
    public string TopicName { get; init; } = string.Empty;
    public string Direction { get; init; } = string.Empty;
    public string UserAnswer { get; init; } = string.Empty;
    public string ExpectedAnswer { get; init; } = string.Empty;
    public bool IsCorrect { get; init; }
    public string Result { get; init; } = string.Empty;
    public int ScoreSnapshot { get; init; }
    public int SecondsSpent { get; init; }
    public DateTime ReviewedAtUtc { get; init; }
}

public sealed class BandLearningProgressDto
{
    public int BandId { get; init; }
    public string BandName { get; init; } = string.Empty;
    public int TotalWords { get; init; }
    public int ReviewedWords { get; init; }
    public int MasteredWords { get; init; }
    public double AverageMasteryScore { get; init; }
}

public sealed class TopicLearningProgressDto
{
    public int TopicId { get; init; }
    public string TopicName { get; init; } = string.Empty;
    public string ColorHex { get; init; } = "#C51E3A";
    public int TotalWords { get; init; }
    public int ReviewedWords { get; init; }
    public int MasteredWords { get; init; }
    public double AverageMasteryScore { get; init; }
}

public sealed class ProgressOverviewDto
{
    public int TotalSessions { get; init; }
    public int ActiveSessions { get; init; }
    public int TotalReviews { get; init; }
    public int MasteredWords { get; init; }
    public int WordsInProgress { get; init; }
    public double AverageMasteryScore { get; init; }
    public int CurrentStudyStreakDays { get; init; }
    public int BestAnswerStreak { get; init; }
}

public sealed class LearningProgressResponse
{
    public ProgressOverviewDto Overview { get; init; } = new();
    public IReadOnlyCollection<LearningSessionSummaryDto> RecentSessions { get; init; } = Array.Empty<LearningSessionSummaryDto>();
    public IReadOnlyCollection<ReviewHistoryItemDto> RecentReviews { get; init; } = Array.Empty<ReviewHistoryItemDto>();
    public IReadOnlyCollection<BandLearningProgressDto> BandProgress { get; init; } = Array.Empty<BandLearningProgressDto>();
    public IReadOnlyCollection<TopicLearningProgressDto> TopicProgress { get; init; } = Array.Empty<TopicLearningProgressDto>();
    public IReadOnlyCollection<LearningVocabularyCardDto> FocusWords { get; init; } = Array.Empty<LearningVocabularyCardDto>();
}
