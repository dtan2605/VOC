using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserService.API.Models;
using UserService.Persistence;

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

        var profile = await _dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(profile => profile.Id == userId);

        if (profile is null)
        {
            return NotFound("User profile not found.");
        }

        return Ok(new UserProfileResponse
        {
            Id = profile.Id,
            Email = profile.Email,
            FullName = profile.FullName,
            Roles = profile.Roles.Split(',', StringSplitOptions.RemoveEmptyEntries)
        });
    }
}
