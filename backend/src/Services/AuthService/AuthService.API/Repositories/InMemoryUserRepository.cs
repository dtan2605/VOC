using System.Collections.Concurrent;
using AuthService.API.Interfaces;
using AuthService.API.Models;

namespace AuthService.API.Repositories;

public sealed class InMemoryUserRepository : IUserRepository
{
    private static int _idCounter;
    private readonly ConcurrentDictionary<int, User> _users = new();

    public Task<User> AddUserAsync(User user)
    {
        user.Id = Interlocked.Increment(ref _idCounter);
        _users[user.Id] = user;
        return Task.FromResult(user);
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        var user = _users.Values.FirstOrDefault(x => x.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(user);
    }

    public Task<User?> GetByIdAsync(int id)
    {
        _users.TryGetValue(id, out var user);
        return Task.FromResult(user);
    }
}
