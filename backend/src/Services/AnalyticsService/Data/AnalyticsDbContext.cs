using AnalyticsService.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AnalyticsService.API.Data
{
    public class AnalyticsDbContext : DbContext
    {
        public AnalyticsDbContext(DbContextOptions<AnalyticsDbContext> options) : base(options)
        {
        }

        public DbSet<StudyEvent> StudyEvents { get; set; } = null!;
        public DbSet<DailyUserMetric> DailyUserMetrics { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<StudyEvent>(b =>
            {
                b.ToTable("study_events");
                b.HasKey(x => x.Id);
                b.Property(x => x.UserId).HasColumnName("user_id");
                b.Property(x => x.WordId).HasColumnName("word_id");
                b.Property(x => x.Action).HasColumnName("action");
                b.Property(x => x.CreatedAt).HasColumnName("created_at");
            });

            modelBuilder.Entity<DailyUserMetric>(b =>
            {
                b.ToTable("daily_user_metrics");
                b.HasKey(x => x.Id);
                b.Property(x => x.UserId).HasColumnName("user_id");
                b.Property(x => x.MetricDate).HasColumnName("metric_date");
                b.Property(x => x.StudySessions).HasColumnName("study_sessions");
                b.Property(x => x.ReviewedCount).HasColumnName("reviewed_count");
                b.Property(x => x.AvgMastery).HasColumnName("avg_mastery");
            });
        }
    }
}
