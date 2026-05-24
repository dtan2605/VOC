using AuthService.API.Interfaces;
using AuthService.API.Models;
using AuthService.Persistence;
using AuthService.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace AuthService.API.Repositories;

public sealed class EfUserRepository : IUserRepository
{
    private readonly AuthDbContext _dbContext;

    public EfUserRepository(AuthDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var entity = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email);

        return entity is null ? null : Map(entity);
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        var entity = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        return entity is null ? null : Map(entity);
    }

    public async Task<User> AddUserAsync(User user)
    {
        var entity = new UserEntity
        {
            Email = user.Email,
            PasswordHash = user.PasswordHash,
            FullName = user.FullName,
            Roles = string.Join(',', user.Roles),
            CreatedAt = user.CreatedAt
        };

        _dbContext.Users.Add(entity);
        await _dbContext.SaveChangesAsync();

        user.Id = entity.Id;
        return user;
    }

    private static User Map(UserEntity entity)
    {
        return new User
        {
            Id = entity.Id,
            Email = entity.Email,
            PasswordHash = entity.PasswordHash,
            FullName = entity.FullName,
            Roles = entity.Roles.Split(',', StringSplitOptions.RemoveEmptyEntries),
            CreatedAt = entity.CreatedAt
        };
    }
}
