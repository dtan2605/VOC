using GrammarService.Domain.Entities;
using GrammarService.Domain.Interfaces;
using GrammarService.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GrammarService.Persistence.Repositories;

public class GrammarBandRepository
    : IGrammarBandRepository
{
    private readonly GrammarDbContext _context;

    public GrammarBandRepository(
        GrammarDbContext context)
    {
        _context = context;
    }

    public async Task<List<GrammarBand>> GetAllAsync()
    {
        return await _context.GrammarBands
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<GrammarBand?> GetByIdAsync(Guid id)
    {
        return await _context.GrammarBands
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task AddAsync(GrammarBand band)
    {
        await _context.GrammarBands.AddAsync(band);
    }

    public void Update(GrammarBand band)
    {
        _context.GrammarBands.Update(band);
    }

    public void Delete(GrammarBand band)
    {
        _context.GrammarBands.Remove(band);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}