using LearningService.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace LearningService.API.Controllers
{
    [ApiController]
    [Route("api/internal/learning")]
    public sealed class InternalLearningController : ControllerBase
    {
        private readonly LearningDbContext _dbContext;
        private readonly IConfiguration _configuration;

        public InternalLearningController(LearningDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        // Internal endpoint used by AnalyticsService to fetch a user's average mastery.
        // Secured by a shared secret header `X-Service-Token` configured in env var `INTERNAL_API_KEY`.
        [HttpGet("progress/{userId:int}")]
        public async Task<IActionResult> GetUserProgress(int userId)
        {
            var expected = _configuration["INTERNAL_API_KEY"];
            var provided = Request.Headers["X-Service-Token"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(expected) || !string.Equals(expected, provided, StringComparison.Ordinal))
            {
                return Unauthorized();
            }

            var masteryScores = await _dbContext.MasteryScores
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .ToListAsync();

            var overview = new
            {
                AverageMasteryScore = masteryScores.Count == 0 ? 0.0 : Math.Round(masteryScores.Average(x => x.Score), 1)
            };

            return Ok(overview);
        }
    }
}
