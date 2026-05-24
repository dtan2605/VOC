using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VocabularyService.API.Dtos;
using VocabularyService.API.Models;
using VocabularyService.Persistence;
using VocabularyService.Persistence.Entities;

namespace VocabularyService.API.Controllers;

[Authorize]
[ApiController]
[Route("api/vocabulary")]
public sealed class VocabularyController : ControllerBase
{
    private readonly VocabularyDbContext _dbContext;

    public VocabularyController(VocabularyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<VocabularyDto>>> GetVocabulary(
        [FromQuery] string? search,
        [FromQuery] int? topicId,
        [FromQuery] int? bandId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.Vocabularies
            .AsNoTracking()
            .Include(x => x.Topic)
            .Include(x => x.Band)
            .Include(x => x.Examples.OrderBy(e => e.DisplayOrder))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLower();
            query = query.Where(x =>
                x.Word.ToLower().Contains(normalized) ||
                x.Meaning.ToLower().Contains(normalized) ||
                x.PartOfSpeech.ToLower().Contains(normalized));
        }

        if (topicId.HasValue)
        {
            query = query.Where(x => x.TopicId == topicId.Value);
        }

        if (bandId.HasValue)
        {
            query = query.Where(x => x.BandId == bandId.Value);
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
        var vocabulary = await _dbContext.Vocabularies
            .AsNoTracking()
            .Include(x => x.Topic)
            .Include(x => x.Band)
            .Include(x => x.Examples.OrderBy(e => e.DisplayOrder))
            .FirstOrDefaultAsync(x => x.Id == id);

        return vocabulary is null ? NotFound("Vocabulary not found.") : Ok(MapVocabulary(vocabulary));
    }

    [HttpPost]
    public async Task<ActionResult<VocabularyDto>> CreateVocabulary([FromBody] UpsertVocabularyRequest request)
    {
        var validationMessage = await ValidateVocabularyRequest(request);
        if (validationMessage is not null)
        {
            return validationMessage;
        }

        var vocabulary = new VocabularyEntity
        {
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

        return CreatedAtAction(nameof(GetVocabularyById), new { id = vocabulary.Id }, MapVocabulary(vocabulary));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<VocabularyDto>> UpdateVocabulary(int id, [FromBody] UpsertVocabularyRequest request)
    {
        var validationMessage = await ValidateVocabularyRequest(request, id);
        if (validationMessage is not null)
        {
            return validationMessage;
        }

        var vocabulary = await _dbContext.Vocabularies
            .Include(x => x.Examples)
            .Include(x => x.Band)
            .Include(x => x.Topic)
            .FirstOrDefaultAsync(x => x.Id == id);

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

        return Ok(MapVocabulary(vocabulary));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteVocabulary(int id)
    {
        var vocabulary = await _dbContext.Vocabularies.FirstOrDefaultAsync(x => x.Id == id);
        if (vocabulary is null)
        {
            return NotFound("Vocabulary not found.");
        }

        _dbContext.Vocabularies.Remove(vocabulary);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ActionResult?> ValidateVocabularyRequest(UpsertVocabularyRequest request, int? currentId = null)
    {
        if (string.IsNullOrWhiteSpace(request.Word) || string.IsNullOrWhiteSpace(request.Meaning))
        {
            return BadRequest("Word and meaning are required.");
        }

        var bandExists = await _dbContext.Bands.AnyAsync(x => x.Id == request.BandId);
        if (!bandExists)
        {
            return BadRequest("Band does not exist.");
        }

        var topicExists = await _dbContext.Topics.AnyAsync(x => x.Id == request.TopicId);
        if (!topicExists)
        {
            return BadRequest("Topic does not exist.");
        }

        var normalizedWord = request.Word.Trim();
        var normalizedTopicId = request.TopicId;
        var exists = await _dbContext.Vocabularies.AnyAsync(x =>
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
