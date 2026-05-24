using AuthService.API.Models;

namespace AuthService.API.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int id);
    Task<User> AddUserAsync(User user);
}
