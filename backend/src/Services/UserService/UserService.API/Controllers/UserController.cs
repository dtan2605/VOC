using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserService.API.Models;
using UserService.Persistence;
using UserService.Persistence.Entities;

namespace UserService.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class UserController : ControllerBase
{
    private readonly UserDbContext _dbContext;

    public UserController(UserDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var profile = await _dbContext.UserProfiles.FirstOrDefaultAsync(profile => profile.Id == userId);
        if (profile is null)
        {
            profile = new UserProfileEntity
            {
                Id = userId,
                Email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value ?? string.Empty,
                FullName = User.FindFirst(ClaimTypes.Name)?.Value ?? "VOC User",
                Roles = string.Join(',', User.FindAll(ClaimTypes.Role).Select(claim => claim.Value).Distinct())
            };

            if (string.IsNullOrWhiteSpace(profile.Email))
            {
                return NotFound("User profile not found.");
            }

            if (string.IsNullOrWhiteSpace(profile.Roles))
            {
                profile.Roles = "User";
            }

            _dbContext.UserProfiles.Add(profile);
            await _dbContext.SaveChangesAsync();
        }

        var avatarUrl = string.IsNullOrWhiteSpace(profile.AvatarPath)
            ? null
            : $"/api/user/avatar/{profile.Id}";

        return Ok(new UserProfileResponse
        {
            Id = profile.Id,
            Email = profile.Email,
            FullName = profile.FullName,
            Roles = profile.Roles.Split(',', StringSplitOptions.RemoveEmptyEntries),
            AvatarUrl = avatarUrl
        });
    }

    [HttpPost("me/avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest("File is required.");
        }

        var uploadDir = (HttpContext.RequestServices.GetService(typeof(Microsoft.Extensions.Configuration.IConfiguration)) as Microsoft.Extensions.Configuration.IConfiguration)?["UserService:AvatarPath"]
                        ?? Environment.GetEnvironmentVariable("USER_AVATAR_PATH")
                        ?? "/data/avatars";

        try
        {
            Directory.CreateDirectory(uploadDir);
            var ext = Path.GetExtension(file.FileName);
            var fileName = $"avatar_{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";
            var fullPath = Path.Combine(uploadDir, fileName);

            await using (var stream = System.IO.File.Create(fullPath))
            {
                await file.CopyToAsync(stream);
            }

            var profile = await _dbContext.UserProfiles.FirstOrDefaultAsync(p => p.Id == userId);
            if (profile is null)
            {
                return NotFound("Profile not found.");
            }

            profile.AvatarPath = fileName;
            await _dbContext.SaveChangesAsync();

            return Ok(new { avatarUrl = $"/api/user/avatar/{profile.Id}" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = ex.Message });
        }
    }

    [HttpGet("avatar/{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvatar(int id)
    {
        var profile = await _dbContext.UserProfiles.FirstOrDefaultAsync(p => p.Id == id);
        if (profile is null || string.IsNullOrWhiteSpace(profile.AvatarPath))
        {
            return NotFound();
        }

        var uploadDir = (HttpContext.RequestServices.GetService(typeof(Microsoft.Extensions.Configuration.IConfiguration)) as Microsoft.Extensions.Configuration.IConfiguration)?["UserService:AvatarPath"]
                        ?? Environment.GetEnvironmentVariable("USER_AVATAR_PATH")
                        ?? "/data/avatars";

        var fullPath = Path.Combine(uploadDir, profile.AvatarPath);
        if (!System.IO.File.Exists(fullPath)) return NotFound();

        var contentType = "application/octet-stream";
        var ext = Path.GetExtension(fullPath).ToLowerInvariant();
        if (ext == ".png") contentType = "image/png";
        else if (ext == ".jpg" || ext == ".jpeg") contentType = "image/jpeg";
        else if (ext == ".gif") contentType = "image/gif";

        return PhysicalFile(fullPath, contentType);
    }
}
