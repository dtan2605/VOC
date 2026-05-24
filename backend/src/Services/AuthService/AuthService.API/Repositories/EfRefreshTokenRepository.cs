using AuthService.API.Interfaces;
using AuthService.API.Models;
using AuthService.Persistence;
using AuthService.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace AuthService.API.Repositories;

public sealed class EfRefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AuthDbContext _dbContext;

    public EfRefreshTokenRepository(AuthDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        var entity = await _dbContext.RefreshTokens
            .AsNoTracking()
            .FirstOrDefaultAsync(rt => rt.Token == token);

        return entity is null ? null : Map(entity);
    }

    public async Task AddAsync(RefreshToken refreshToken)
    {
        var entity = new RefreshTokenEntity
        {
            Token = refreshToken.Token,
            UserId = refreshToken.UserId,
            ExpiresAt = refreshToken.ExpiresAt,
            IsRevoked = refreshToken.IsRevoked,
            CreatedAt = refreshToken.CreatedAt
        };

        _dbContext.RefreshTokens.Add(entity);
        await _dbContext.SaveChangesAsync();
    }

    public async Task RevokeAsync(string token)
    {
        var entity = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token);
        if (entity is null)
        {
            return;
        }

        entity.IsRevoked = true;
        await _dbContext.SaveChangesAsync();
    }

    private static RefreshToken Map(RefreshTokenEntity entity)
    {
        return new RefreshToken
        {
            Token = entity.Token,
            UserId = entity.UserId,
            ExpiresAt = entity.ExpiresAt,
            CreatedAt = entity.CreatedAt,
            IsRevoked = entity.IsRevoked
        };
    }
}
