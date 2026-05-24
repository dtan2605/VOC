using System.Collections.Concurrent;
using AuthService.API.Interfaces;
using AuthService.API.Models;

namespace AuthService.API.Repositories;

public sealed class InMemoryRefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ConcurrentDictionary<string, RefreshToken> _refreshTokens = new();

    public Task AddAsync(RefreshToken refreshToken)
    {
        _refreshTokens[refreshToken.Token] = refreshToken;
        return Task.CompletedTask;
    }

    public Task<RefreshToken?> GetByTokenAsync(string token)
    {
        _refreshTokens.TryGetValue(token, out var refreshToken);
        return Task.FromResult(refreshToken);
    }

    public Task RevokeAsync(string token)
    {
        if (_refreshTokens.TryGetValue(token, out var refreshToken))
        {
            refreshToken.IsRevoked = true;
            _refreshTokens[token] = refreshToken;
        }

        return Task.CompletedTask;
    }
}
