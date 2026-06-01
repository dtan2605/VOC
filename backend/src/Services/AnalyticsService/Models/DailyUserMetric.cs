using System;

namespace AnalyticsService.API.Models
{
    public class DailyUserMetric
    {
        public long Id { get; set; }
        public string? UserId { get; set; }
        public DateTime MetricDate { get; set; }
        public int StudySessions { get; set; }
        public int ReviewedCount { get; set; }
        public decimal? AvgMastery { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
