using AnalyticsService.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using AnalyticsService.API.Models;

namespace AnalyticsService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly AnalyticsDbContext _db;

        public AnalyticsController(AnalyticsDbContext db)
        {
            _db = db;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStudyStats([FromQuery] string? userId = null, [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null)
        {
            var q = _db.StudyEvents.AsQueryable();
            if (!string.IsNullOrEmpty(userId)) q = q.Where(x => x.UserId == userId);
            if (start.HasValue) q = q.Where(x => x.CreatedAt >= start.Value);
            if (end.HasValue) q = q.Where(x => x.CreatedAt <= end.Value);

            var totalReviewed = await q.CountAsync();
            var totalStudySessions = await q.Select(x => x.CreatedAt.Date).Distinct().CountAsync();

            var daily = await q.GroupBy(x => x.CreatedAt.Date)
                .Select(g => new { date = g.Key, count = g.Count() })
                .OrderByDescending(x => x.date)
                .ToListAsync();

            return Ok(new { totalStudySessions, totalReviewed, daily });
        }

        [HttpGet("streaks")]
        public async Task<IActionResult> GetStreaks([FromQuery] string? userId = null)
        {
            var q = _db.StudyEvents.AsQueryable();
            if (!string.IsNullOrEmpty(userId)) q = q.Where(x => x.UserId == userId);

            var dates = await q
                .Select(x => x.CreatedAt.Date)
                .Distinct()
                .OrderBy(d => d)
                .ToListAsync();

            int longest = 0;
            int current = 0;
            DateTime? prev = null;

            foreach (var d in dates)
            {
                if (prev == null || d == prev.Value.AddDays(1))
                {
                    current++;
                }
                else
                {
                    if (current > longest) longest = current;
                    current = 1;
                }
                prev = d;
            }
            if (current > longest) longest = current;

            // compute currentStreak: consecutive days up to today
            int currentStreak = 0;
            var today = DateTime.UtcNow.Date;
            for (int i = 0; i < dates.Count; i++) { }
            // iterate backwards
            for (int i = dates.Count - 1; i >= 0; i--)
            {
                if ((today - dates[i]).Days == 0)
                {
                    currentStreak = 1;
                    today = today.AddDays(-1);
                    continue;
                }
                if ((today - dates[i]).Days == 0)
                {
                    currentStreak++;
                    today = today.AddDays(-1);
                }
                else if ((today - dates[i]).Days > 0)
                {
                    break;
                }
            }

            return Ok(new { currentStreak, longestStreak = longest });
        }

        [HttpGet("mastery")]
        public async Task<IActionResult> GetMastery([FromQuery] string? userId = null, [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null)
        {
            var q = _db.DailyUserMetrics.AsQueryable();
            if (!string.IsNullOrEmpty(userId)) q = q.Where(x => x.UserId == userId);
            if (start.HasValue) q = q.Where(x => x.MetricDate >= start.Value.Date);
            if (end.HasValue) q = q.Where(x => x.MetricDate <= end.Value.Date);

            var avg = await q.AverageAsync(x => (decimal?)x.AvgMastery) ?? 0m;
            var timeseries = await q.OrderByDescending(x => x.MetricDate)
                .Select(x => new { date = x.MetricDate, avgMastery = x.AvgMastery })
                .ToListAsync();

            return Ok(new { averageMastery = avg, timeseries });
        }

        [HttpPost("events")]
        public async Task<IActionResult> IngestEvent([FromBody] StudyEvent? evt)
        {
            if (evt is null) return BadRequest();
            if (evt.CreatedAt == default) evt.CreatedAt = DateTime.UtcNow;
            _db.StudyEvents.Add(evt);
            await _db.SaveChangesAsync();
            return Accepted();
        }
    }
}
