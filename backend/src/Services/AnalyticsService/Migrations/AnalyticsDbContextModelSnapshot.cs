using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace AnalyticsService.API.Migrations
{
    [DbContext(typeof(AnalyticsService.API.Data.AnalyticsDbContext))]
    partial class AnalyticsDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder
                .HasAnnotation("ProductVersion", "7.0.0");

            modelBuilder.Entity("AnalyticsService.API.Models.StudyEvent", b =>
            {
                b.Property<long>("Id").ValueGeneratedOnAdd();
                b.Property<string>("UserId").IsRequired();
                b.Property<int>("WordId");
                b.Property<string>("Action").IsRequired();
                b.Property<DateTime>("CreatedAt");
                b.HasKey("Id");
                b.ToTable("study_events");
            });

            modelBuilder.Entity("AnalyticsService.API.Models.DailyUserMetric", b =>
            {
                b.Property<long>("Id").ValueGeneratedOnAdd();
                b.Property<string>("UserId").IsRequired();
                b.Property<DateTime>("MetricDate");
                b.Property<int>("StudySessions");
                b.Property<int>("ReviewedCount");
                b.Property<decimal?>("AvgMastery");
                b.Property<DateTime>("CreatedAt");
                b.HasKey("Id");
                b.HasIndex("UserId", "MetricDate").IsUnique();
                b.ToTable("daily_user_metrics");
            });
        }
    }
}
