using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VocabularyService.API.Dtos;
using VocabularyService.API.Extensions;
using VocabularyService.API.Models;
using VocabularyService.API.Services;
using VocabularyService.Persistence;
using VocabularyService.Persistence.Entities;

namespace VocabularyService.API.Controllers;

[Authorize]
[ApiController]
[Route("api/vocabulary")]
public sealed class VocabularyController : ControllerBase
{
    private readonly VocabularyDbContext _dbContext;
    private readonly IVocabularyAiService _vocabularyAiService;
    private readonly IVocabularyAiEventPublisher _eventPublisher;
    private readonly IUserVocabularyInitializationService _initializationService;

    public VocabularyController(
        VocabularyDbContext dbContext,
        IVocabularyAiService vocabularyAiService,
        IVocabularyAiEventPublisher eventPublisher,
        IUserVocabularyInitializationService initializationService)
    {
        _dbContext = dbContext;
        _vocabularyAiService = vocabularyAiService;
        _eventPublisher = eventPublisher;
        _initializationService = initializationService;
    }

    /// <summary>
    /// Initialize default vocabulary for the current user.
    /// This endpoint clones global default bands, topics, and vocabularies into the user's personal space.
    /// Safe to call multiple times - idempotent operation.
    /// </summary>
    [HttpPost("initialize")]
    public async Task<IActionResult> InitializeUserVocabulary(CancellationToken cancellationToken)
    {
        if (!this.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            await _initializationService.InitializeUserVocabularyAsync(userId, cancellationToken);
            return Ok(new { message = "User vocabulary initialized successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { error = "Failed to initialize vocabulary", details = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<VocabularyDto>>> GetVocabulary(
        [FromQuery] string? search,
        [FromQuery] string? topics,
        [FromQuery] string? bands,
        [FromQuery] string? pos,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        if (!this.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var query = _dbContext.Vocabularies
            .AsNoTracking()
            .Include(x => x.Topic)
            .Include(x => x.Band)
            .Include(x => x.Examples.OrderBy(e => e.DisplayOrder))
            .Where(x => x.UserId == null || x.UserId == userId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLower();
            query = query.Where(x =>
                x.Word.ToLower().Contains(normalized) ||
                x.Meaning.ToLower().Contains(normalized) ||
                x.PartOfSpeech.ToLower().Contains(normalized));
        }

        // Parse CSV filter parameters (bands, topics, pos)
        var topicIds = new List<int>();
        var bandIds = new List<int>();
        var posList = new List<string>();

        if (!string.IsNullOrWhiteSpace(topics))
        {
            topicIds = topics.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => { if (int.TryParse(s, out var v)) return v; return -1; })
                .Where(v => v > 0).ToList();
        }

        if (!string.IsNullOrWhiteSpace(bands))
        {
            bandIds = bands.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => { if (int.TryParse(s, out var v)) return v; return -1; })
                .Where(v => v > 0).ToList();
        }

        if (!string.IsNullOrWhiteSpace(pos))
        {
            posList = pos.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => s.ToLower()).Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
        }

        // If any multi-filters provided, apply OR logic across categories: band OR topic OR pos
        if (topicIds.Count > 0 || bandIds.Count > 0 || posList.Count > 0)
        {
            query = query.Where(x =>
                (bandIds.Count > 0 && bandIds.Contains(x.BandId)) ||
                (topicIds.Count > 0 && topicIds.Contains(x.TopicId)) ||
                (posList.Count > 0 && posList.Contains(x.PartOfSpeech.ToLower()))
            );
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.UpdatedAt)
            .ThenBy(x => x.Word)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PagedResult<VocabularyDto>
        {
            Items = items.Select(MapVocabulary).ToArray(),
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<VocabularyDto>> GetVocabularyById(int id)
    {
        if (!this.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var vocabulary = await _dbContext.Vocabularies
            .AsNoTracking()
            .Include(x => x.Topic)
            .Include(x => x.Band)
            .Include(x => x.Examples.OrderBy(e => e.DisplayOrder))
            .FirstOrDefaultAsync(x => x.Id == id && (x.UserId == null || x.UserId == userId));

        return vocabulary is null ? NotFound("Vocabulary not found.") : Ok(MapVocabulary(vocabulary));
    }

    [HttpPost("ai/suggest")]
    public async Task<ActionResult<VocabularyAiSuggestResponse>> SuggestVocabulary([FromBody] VocabularyAiSuggestRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Word))
        {
            return BadRequest("Word is required.");
        }

        try
        {
            var suggestion = await _vocabularyAiService.SuggestAsync(request.Word, cancellationToken);
            await _eventPublisher.PublishSuggestionGeneratedAsync(suggestion, cancellationToken);
            return Ok(suggestion);
        }
        catch (Exception exception)
        {
            // Trả về chi tiết hơn để debug (frontend chỉ thấy 502 trước đây)
            var detail = exception.ToString();
            if (exception.InnerException is not null)
            {
                detail += Environment.NewLine + "InnerException:" + Environment.NewLine + exception.InnerException;
            }

            return Problem(
                title: "AI suggestion is unavailable.",
                detail: detail,
                statusCode: StatusCodes.Status502BadGateway);
        }

    }

    [HttpPost]
    public async Task<ActionResult<VocabularyDto>> CreateVocabulary([FromBody] UpsertVocabularyRequest request, CancellationToken cancellationToken)
    {
        if (!this.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var validationMessage = await ValidateVocabularyRequest(request, userId);
        if (validationMessage is not null)
        {
            return validationMessage;
        }

        var vocabulary = new VocabularyEntity
        {
            UserId = userId,
            Word = request.Word.Trim(),
            Meaning = request.Meaning.Trim(),
            PartOfSpeech = request.PartOfSpeech.Trim(),
            Pronunciation = request.Pronunciation.Trim(),
            BandId = request.BandId,
            TopicId = request.TopicId,
            Examples = request.Examples
                .Where(x => !string.IsNullOrWhiteSpace(x.EnglishText))
                .OrderBy(x => x.DisplayOrder)
                .Select(x => new ExampleSentenceEntity
                {
                    EnglishText = x.EnglishText.Trim(),
                    VietnameseMeaning = x.VietnameseMeaning.Trim(),
                    DisplayOrder = x.DisplayOrder
                })
                .ToList()
        };

        _dbContext.Vocabularies.Add(vocabulary);
        await _dbContext.SaveChangesAsync();

        await _dbContext.Entry(vocabulary).Reference(x => x.Band).LoadAsync();
        await _dbContext.Entry(vocabulary).Reference(x => x.Topic).LoadAsync();
        await _dbContext.Entry(vocabulary).Collection(x => x.Examples).LoadAsync();
        var response = MapVocabulary(vocabulary);
        await _eventPublisher.PublishVocabularySavedAsync(response, cancellationToken);

        return CreatedAtAction(nameof(GetVocabularyById), new { id = vocabulary.Id }, response);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<VocabularyDto>> UpdateVocabulary(int id, [FromBody] UpsertVocabularyRequest request, CancellationToken cancellationToken)
    {
        if (!this.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var validationMessage = await ValidateVocabularyRequest(request, userId, id);
        if (validationMessage is not null)
        {
            return validationMessage;
        }

        var vocabulary = await _dbContext.Vocabularies
            .Include(x => x.Examples)
            .Include(x => x.Band)
            .Include(x => x.Topic)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

        if (vocabulary is null)
        {
            return NotFound("Vocabulary not found.");
        }

        vocabulary.Word = request.Word.Trim();
        vocabulary.Meaning = request.Meaning.Trim();
        vocabulary.PartOfSpeech = request.PartOfSpeech.Trim();
        vocabulary.Pronunciation = request.Pronunciation.Trim();
        vocabulary.BandId = request.BandId;
        vocabulary.TopicId = request.TopicId;
        vocabulary.UpdatedAt = DateTime.UtcNow;

        _dbContext.ExampleSentences.RemoveRange(vocabulary.Examples);
        vocabulary.Examples = request.Examples
            .Where(x => !string.IsNullOrWhiteSpace(x.EnglishText))
            .OrderBy(x => x.DisplayOrder)
            .Select(x => new ExampleSentenceEntity
            {
                EnglishText = x.EnglishText.Trim(),
                VietnameseMeaning = x.VietnameseMeaning.Trim(),
                DisplayOrder = x.DisplayOrder
            })
            .ToList();

        await _dbContext.SaveChangesAsync();

        await _dbContext.Entry(vocabulary).Reference(x => x.Band).LoadAsync();
        await _dbContext.Entry(vocabulary).Reference(x => x.Topic).LoadAsync();
        await _dbContext.Entry(vocabulary).Collection(x => x.Examples).LoadAsync();
        var response = MapVocabulary(vocabulary);
        await _eventPublisher.PublishVocabularySavedAsync(response, cancellationToken);

        return Ok(response);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteVocabulary(int id)
    {
        if (!this.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var vocabulary = await _dbContext.Vocabularies.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (vocabulary is null)
        {
            return NotFound("Vocabulary not found.");
        }

        _dbContext.Vocabularies.Remove(vocabulary);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ActionResult?> ValidateVocabularyRequest(UpsertVocabularyRequest request, int userId, int? currentId = null)
    {
        if (string.IsNullOrWhiteSpace(request.Word) || string.IsNullOrWhiteSpace(request.Meaning))
        {
            return BadRequest("Word and meaning are required.");
        }

        var bandExists = await _dbContext.Bands.AnyAsync(x => x.Id == request.BandId && (x.UserId == null || x.UserId == userId));
        if (!bandExists)
        {
            return BadRequest("Band does not exist.");
        }

        var topicExists = await _dbContext.Topics.AnyAsync(x => x.Id == request.TopicId && (x.UserId == null || x.UserId == userId));
        if (!topicExists)
        {
            return BadRequest("Topic does not exist.");
        }

        var normalizedWord = request.Word.Trim();
        var normalizedTopicId = request.TopicId;
        var exists = await _dbContext.Vocabularies.AnyAsync(x =>
            x.UserId == userId &&
            x.TopicId == normalizedTopicId &&
            x.Word == normalizedWord &&
            (!currentId.HasValue || x.Id != currentId.Value));

        if (exists)
        {
            return Conflict("This word already exists in the selected topic.");
        }

        return null;
    }

    private static VocabularyDto MapVocabulary(VocabularyEntity vocabulary)
    {
        return new VocabularyDto
        {
            Id = vocabulary.Id,
            Word = vocabulary.Word,
            Meaning = vocabulary.Meaning,
            PartOfSpeech = vocabulary.PartOfSpeech,
            Pronunciation = vocabulary.Pronunciation,
            BandId = vocabulary.BandId,
            BandName = vocabulary.Band?.Name ?? string.Empty,
            TopicId = vocabulary.TopicId,
            TopicName = vocabulary.Topic?.Name ?? string.Empty,
            CreatedAt = vocabulary.CreatedAt,
            UpdatedAt = vocabulary.UpdatedAt,
            Examples = vocabulary.Examples
                .OrderBy(x => x.DisplayOrder)
                .Select(x => new ExampleSentenceDto
                {
                    Id = x.Id,
                    EnglishText = x.EnglishText,
                    VietnameseMeaning = x.VietnameseMeaning,
                    DisplayOrder = x.DisplayOrder
                })
                .ToArray()
        };
    }
}

