using AnalyticsService.API.Data;
using AnalyticsService.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AnalyticsService.API.Services
{
    public class AnalyticsAggregator : BackgroundService
    {
        // DTO used to parse LearningService internal response
        private sealed class ProgressResp
        {
            public double AverageMasteryScore { get; set; }
        }
        private readonly IServiceProvider _services;
        private readonly ILogger<AnalyticsAggregator> _logger;
        private readonly TimeSpan _interval;

        public AnalyticsAggregator(IServiceProvider services, ILogger<AnalyticsAggregator> logger, IConfiguration configuration)
        {
            _services = services;
            _logger = logger;
            var seconds = configuration["AGGREGATOR_INTERVAL_SECONDS"];
            if (!int.TryParse(seconds, out var s)) s = 3600; // default 1 hour
            _interval = TimeSpan.FromSeconds(s);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Analytics aggregator starting, interval {Interval}", _interval);
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await AggregateOnce(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during analytics aggregation");
                }

                try
                {
                    await Task.Delay(_interval, stoppingToken);
                }
                catch (TaskCanceledException) { break; }
            }
            _logger.LogInformation("Analytics aggregator stopping");
        }

        private async Task AggregateOnce(CancellationToken cancellationToken)
        {
            using var scope = _services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AnalyticsDbContext>();

            // Aggregate last 7 days by default
            var cutoff = DateTime.UtcNow.Date.AddDays(-7);
            var groups = await db.StudyEvents
                .Where(e => e.CreatedAt >= cutoff)
                .AsNoTracking()
                .GroupBy(e => new { e.UserId, Date = e.CreatedAt.Date })
                .ToListAsync(cancellationToken);

            var httpFactory = scope.ServiceProvider.GetService(typeof(IHttpClientFactory)) as IHttpClientFactory;

            foreach (var g in groups)
            {
                var userId = g.Key.UserId ?? string.Empty;
                var date = g.Key.Date;
                var events = g.OrderBy(x => x.CreatedAt).ToList();

                // compute sessions by clustering events separated by >30 minutes
                int sessions = 0;
                DateTime? last = null;
                foreach (var ev in events)
                {
                    if (last == null || (ev.CreatedAt - last.Value).TotalMinutes > 30)
                    {
                        sessions++;
                    }
                    last = ev.CreatedAt;
                }

                var reviewedCount = events.Count;

                // attempt to fetch average mastery from LearningService internal endpoint
                decimal? avgMasteryFraction = null;
                try
                {
                    if (httpFactory is not null && int.TryParse(userId, out var uid))
                    {
                        var client = httpFactory.CreateClient("learning-service");
                        var resp = await client.GetAsync($"/api/internal/learning/progress/{uid}", cancellationToken);
                        if (resp.IsSuccessStatusCode)
                        {
                            var payload = await resp.Content.ReadFromJsonAsync<ProgressResp>(cancellationToken: cancellationToken);
                            if (payload is not null)
                            {
                                // payload.AverageMasteryScore is percent (0-100)
                                avgMasteryFraction = Math.Round((decimal)(payload.AverageMasteryScore / 100.0), 4);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Failed to fetch mastery from LearningService for user {UserId}", userId);
                }

                var existing = await db.DailyUserMetrics.FirstOrDefaultAsync(x => x.UserId == userId && x.MetricDate == date, cancellationToken);
                if (existing == null)
                {
                    var metric = new DailyUserMetric
                    {
                        UserId = userId,
                        MetricDate = date,
                        StudySessions = sessions,
                        ReviewedCount = reviewedCount,
                        AvgMastery = avgMasteryFraction,
                        CreatedAt = DateTime.UtcNow
                    };
                    db.DailyUserMetrics.Add(metric);
                }
                else
                {
                    existing.StudySessions = sessions;
                    existing.ReviewedCount = reviewedCount;
                    existing.AvgMastery = avgMasteryFraction ?? existing.AvgMastery;
                    existing.CreatedAt = DateTime.UtcNow;
                    db.DailyUserMetrics.Update(existing);
                }
            }

            // done

            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Aggregated {Count} user-date groups", groups.Count);
        }
    }
}
