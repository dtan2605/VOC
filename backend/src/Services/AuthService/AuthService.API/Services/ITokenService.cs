using AuthService.API.Dtos;
using AuthService.API.Models;

namespace AuthService.API.Services;

public interface ITokenService
{
    AuthResponse CreateAuthResponse(User user);
    string GenerateRefreshToken();
}
