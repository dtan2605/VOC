using Microsoft.EntityFrameworkCore;
using VocabularyService.Persistence.Entities;

namespace VocabularyService.Persistence;

public sealed class VocabularyDbContext : DbContext
{
    public VocabularyDbContext(DbContextOptions<VocabularyDbContext> options)
        : base(options)
    {
    }

    public DbSet<BandEntity> Bands => Set<BandEntity>();
    public DbSet<TopicEntity> Topics => Set<TopicEntity>();
    public DbSet<VocabularyEntity> Vocabularies => Set<VocabularyEntity>();
    public DbSet<ExampleSentenceEntity> ExampleSentences => Set<ExampleSentenceEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BandEntity>(entity =>
        {
            entity.ToTable("bands");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(400);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<TopicEntity>(entity =>
        {
            entity.ToTable("topics");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(400);
            entity.Property(x => x.ColorHex).HasMaxLength(20).IsRequired();
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<VocabularyEntity>(entity =>
        {
            entity.ToTable("vocabularies");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Word).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Meaning).HasMaxLength(500).IsRequired();
            entity.Property(x => x.PartOfSpeech).HasMaxLength(120);
            entity.Property(x => x.Pronunciation).HasMaxLength(120);
            entity.HasIndex(x => new { x.TopicId, x.Word }).IsUnique();

            entity.HasOne(x => x.Band)
                .WithMany(x => x.Vocabularies)
                .HasForeignKey(x => x.BandId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Topic)
                .WithMany(x => x.Vocabularies)
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ExampleSentenceEntity>(entity =>
        {
            entity.ToTable("examples");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EnglishText).HasMaxLength(500).IsRequired();
            entity.Property(x => x.VietnameseMeaning).HasMaxLength(500);

            entity.HasOne(x => x.Vocabulary)
                .WithMany(x => x.Examples)
                .HasForeignKey(x => x.VocabularyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BandEntity>().HasData(
            new BandEntity { Id = 1, Name = "IELTS 5.0", Description = "Core words for early intermediate learners", SortOrder = 1 },
            new BandEntity { Id = 2, Name = "IELTS 6.0", Description = "Words for developing academic fluency", SortOrder = 2 },
            new BandEntity { Id = 3, Name = "IELTS 7.0", Description = "Advanced academic vocabulary", SortOrder = 3 }
        );

        modelBuilder.Entity<TopicEntity>().HasData(
            new TopicEntity { Id = 1, Name = "Education", Description = "Academic and school-related vocabulary", ColorHex = "#C51E3A" },
            new TopicEntity { Id = 2, Name = "Environment", Description = "Ecology, climate, and sustainability terms", ColorHex = "#8B0000" },
            new TopicEntity { Id = 3, Name = "Travel", Description = "Travel, tourism, and culture vocabulary", ColorHex = "#E54B4B" }
        );

        modelBuilder.Entity<VocabularyEntity>().HasData(
            new VocabularyEntity
            {
                Id = 1,
                Word = "curriculum",
                Meaning = "chuong trinh hoc",
                PartOfSpeech = "noun",
                Pronunciation = "/kəˈrɪk.jə.ləm/",
                BandId = 2,
                TopicId = 1,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new VocabularyEntity
            {
                Id = 2,
                Word = "biodiversity",
                Meaning = "da dang sinh hoc",
                PartOfSpeech = "noun",
                Pronunciation = "/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/",
                BandId = 3,
                TopicId = 2,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<ExampleSentenceEntity>().HasData(
            new ExampleSentenceEntity
            {
                Id = 1,
                VocabularyId = 1,
                EnglishText = "The national curriculum was updated to include more digital skills.",
                VietnameseMeaning = "Chuong trinh hoc quoc gia da duoc cap nhat de bo sung ky nang so.",
                DisplayOrder = 1
            },
            new ExampleSentenceEntity
            {
                Id = 2,
                VocabularyId = 2,
                EnglishText = "Protecting biodiversity is essential for maintaining ecosystem stability.",
                VietnameseMeaning = "Bao ve da dang sinh hoc la dieu thiet yeu de duy tri su on dinh cua he sinh thai.",
                DisplayOrder = 1
            }
        );
    }
}
