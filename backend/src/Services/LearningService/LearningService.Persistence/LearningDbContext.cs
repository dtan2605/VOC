using LearningService.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace LearningService.Persistence;

public sealed class LearningDbContext : DbContext
{
    public LearningDbContext(DbContextOptions<LearningDbContext> options)
        : base(options)
    {
    }

    public DbSet<LearningSessionEntity> LearningSessions => Set<LearningSessionEntity>();
    public DbSet<ReviewHistoryEntity> ReviewHistory => Set<ReviewHistoryEntity>();
    public DbSet<MasteryScoreEntity> MasteryScores => Set<MasteryScoreEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<LearningSessionEntity>(entity =>
        {
            entity.ToTable("learning_sessions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Mode).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Direction).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(40).IsRequired();
            entity.Property(x => x.VocabularyIdsJson).HasColumnType("longtext").IsRequired();
            entity.HasIndex(x => new { x.UserId, x.StartedAtUtc });
            entity.HasIndex(x => new { x.UserId, x.Status });
        });

        modelBuilder.Entity<ReviewHistoryEntity>(entity =>
        {
            entity.ToTable("review_history");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Direction).HasMaxLength(30).IsRequired();
            entity.Property(x => x.UserAnswer).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ExpectedAnswer).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Result).HasMaxLength(30).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.ReviewedAtUtc });
            entity.HasIndex(x => new { x.LearningSessionId, x.VocabularyId }).IsUnique();

            entity.HasOne(x => x.LearningSession)
                .WithMany(x => x.Reviews)
                .HasForeignKey(x => x.LearningSessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MasteryScoreEntity>(entity =>
        {
            entity.ToTable("mastery_scores");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.UserId, x.VocabularyId }).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.Score });
        });
    }
}
