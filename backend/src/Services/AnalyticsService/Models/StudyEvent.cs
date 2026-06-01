using System;

namespace AnalyticsService.API.Models
{
    public class StudyEvent
    {
        public long Id { get; set; }
        public string? UserId { get; set; }
        public int WordId { get; set; }
        public string? Action { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
