using AuthService.API.Dtos;
using AuthService.API.Interfaces;
using AuthService.API.Models;
using AuthService.API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AuthService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly JwtSettings _jwtSettings;

    public AuthController(
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ITokenService tokenService,
        IPasswordHasher<User> passwordHasher,
        IOptions<JwtSettings> jwtOptions)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _jwtSettings = jwtOptions.Value;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return Conflict("Email is already registered.");
        }

        var user = new User
        {
            Email = request.Email.Trim().ToLowerInvariant(),
            FullName = request.FullName.Trim(),
            Roles = new[] { "User" }
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        await _userRepository.AddUserAsync(user);

        var authResponse = _tokenService.CreateAuthResponse(user);
        await _refreshTokenRepository.AddAsync(new RefreshToken
        {
            Token = authResponse.RefreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays)
        });

        return Created(string.Empty, authResponse);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var user = await _userRepository.GetByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (user is null)
        {
            return Unauthorized("Invalid credentials.");
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return Unauthorized("Invalid credentials.");
        }

        var authResponse = _tokenService.CreateAuthResponse(user);
        await _refreshTokenRepository.AddAsync(new RefreshToken
        {
            Token = authResponse.RefreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays)
        });

        return Ok(authResponse);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var storedRefreshToken = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);
        if (storedRefreshToken is null || storedRefreshToken.IsRevoked || storedRefreshToken.IsExpired)
        {
            return Unauthorized("Refresh token is invalid or expired.");
        }

        var user = await _userRepository.GetByIdAsync(storedRefreshToken.UserId);
        if (user is null)
        {
            return Unauthorized("User not found.");
        }

        await _refreshTokenRepository.RevokeAsync(storedRefreshToken.Token);

        var authResponse = _tokenService.CreateAuthResponse(user);
        await _refreshTokenRepository.AddAsync(new RefreshToken
        {
            Token = authResponse.RefreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays)
        });

        return Ok(authResponse);
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke([FromBody] RefreshTokenRequest request)
    {
        await _refreshTokenRepository.RevokeAsync(request.RefreshToken);
        return NoContent();
    }
}
