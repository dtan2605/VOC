using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VocabularyService.API.Dtos;
using VocabularyService.API.Extensions;
using VocabularyService.API.Models;
using VocabularyService.Persistence;
using VocabularyService.Persistence.Entities;

namespace VocabularyService.API.Controllers;

[Authorize]
[ApiController]
[Route("api/bands")]
public sealed class BandController : ControllerBase
{
    private readonly VocabularyDbContext _dbContext;

    public BandController(VocabularyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<BandDto>>> GetBands([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 12)
    {
        if (!this.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.Bands
            .AsNoTracking()
            .Where(x => x.UserId == null || x.UserId == userId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(normalized) || x.Description.ToLower().Contains(normalized));
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new BandDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                SortOrder = x.SortOrder,
                VocabularyCount = _dbContext.Vocabularies.Count(v => v.BandId == x.Id && (v.UserId == null || v.UserId == userId))
            })
            .ToListAsync();

        return Ok(new PagedResult<BandDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpPost]
    public async Task<ActionResult<BandDto>> CreateBand([FromBody] UpsertBandRequest request)
    {
        if (!this.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Band name is required.");
        }

        var normalizedName = request.Name.Trim();
        var exists = await _dbContext.Bands.AnyAsync(x => x.Name == normalizedName && x.UserId == userId);
        if (exists)
        {
            return Conflict("Band name already exists.");
        }

        var band = new BandEntity
        {
            Name = normalizedName,
            Description = request.Description.Trim(),
            SortOrder = request.SortOrder,
            UserId = userId
        };

        _dbContext.Bands.Add(band);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBands), new { id = band.Id }, new BandDto
        {
            Id = band.Id,
            Name = band.Name,
            Description = band.Description,
            SortOrder = band.SortOrder,
            VocabularyCount = 0
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BandDto>> UpdateBand(int id, [FromBody] UpsertBandRequest request)
    {
        if (!this.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var band = await _dbContext.Bands.Include(x => x.Vocabularies).FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (band is null)
        {
            return NotFound("Band not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Band name is required.");
        }

        var normalizedName = request.Name.Trim();
        var nameExists = await _dbContext.Bands.AnyAsync(x => x.Id != id && x.Name == normalizedName && x.UserId == userId);
        if (nameExists)
        {
            return Conflict("Band name already exists.");
        }

        band.Name = normalizedName;
        band.Description = request.Description.Trim();
        band.SortOrder = request.SortOrder;

        await _dbContext.SaveChangesAsync();

        return Ok(new BandDto
        {
            Id = band.Id,
            Name = band.Name,
            Description = band.Description,
            SortOrder = band.SortOrder,
            VocabularyCount = band.Vocabularies.Count
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBand(int id)
    {
        if (!this.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var band = await _dbContext.Bands.Include(x => x.Vocabularies).FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (band is null)
        {
            return NotFound("Band not found.");
        }

        if (band.Vocabularies.Count > 0)
        {
            return Conflict("Cannot delete a band that still contains vocabularies.");
        }

        _dbContext.Bands.Remove(band);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}

