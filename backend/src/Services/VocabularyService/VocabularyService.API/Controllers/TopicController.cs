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
[Route("api/topics")]
public sealed class TopicController : ControllerBase
{
    private readonly VocabularyDbContext _dbContext;

    public TopicController(VocabularyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TopicDto>>> GetTopics([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 12)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.Topics
            .AsNoTracking()
            .Include(x => x.Vocabularies)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(normalized) || x.Description.ToLower().Contains(normalized));
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new TopicDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                ColorHex = x.ColorHex,
                VocabularyCount = x.Vocabularies.Count
            })
            .ToListAsync();

        return Ok(new PagedResult<TopicDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpPost]
    public async Task<ActionResult<TopicDto>> CreateTopic([FromBody] UpsertTopicRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Topic name is required.");
        }

        var normalizedName = request.Name.Trim();
        var exists = await _dbContext.Topics.AnyAsync(x => x.Name == normalizedName);
        if (exists)
        {
            return Conflict("Topic name already exists.");
        }

        var topic = new TopicEntity
        {
            Name = normalizedName,
            Description = request.Description.Trim(),
            ColorHex = string.IsNullOrWhiteSpace(request.ColorHex) ? "#C51E3A" : request.ColorHex.Trim()
        };

        _dbContext.Topics.Add(topic);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTopics), new { id = topic.Id }, new TopicDto
        {
            Id = topic.Id,
            Name = topic.Name,
            Description = topic.Description,
            ColorHex = topic.ColorHex,
            VocabularyCount = 0
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TopicDto>> UpdateTopic(int id, [FromBody] UpsertTopicRequest request)
    {
        var topic = await _dbContext.Topics.Include(x => x.Vocabularies).FirstOrDefaultAsync(x => x.Id == id);
        if (topic is null)
        {
            return NotFound("Topic not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Topic name is required.");
        }

        var normalizedName = request.Name.Trim();
        var nameExists = await _dbContext.Topics.AnyAsync(x => x.Id != id && x.Name == normalizedName);
        if (nameExists)
        {
            return Conflict("Topic name already exists.");
        }

        topic.Name = normalizedName;
        topic.Description = request.Description.Trim();
        topic.ColorHex = string.IsNullOrWhiteSpace(request.ColorHex) ? "#C51E3A" : request.ColorHex.Trim();

        await _dbContext.SaveChangesAsync();

        return Ok(new TopicDto
        {
            Id = topic.Id,
            Name = topic.Name,
            Description = topic.Description,
            ColorHex = topic.ColorHex,
            VocabularyCount = topic.Vocabularies.Count
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTopic(int id)
    {
        var topic = await _dbContext.Topics.Include(x => x.Vocabularies).FirstOrDefaultAsync(x => x.Id == id);
        if (topic is null)
        {
            return NotFound("Topic not found.");
        }

        if (topic.Vocabularies.Count > 0)
        {
            return Conflict("Cannot delete a topic that still contains vocabularies.");
        }

        _dbContext.Topics.Remove(topic);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}
