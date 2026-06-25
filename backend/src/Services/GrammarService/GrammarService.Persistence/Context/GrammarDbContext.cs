using GrammarService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GrammarService.Persistence.Context;

public class GrammarDbContext : DbContext
{
    public GrammarDbContext(
        DbContextOptions<GrammarDbContext> options)
        : base(options)
    {
    }

    public DbSet<GrammarBand> GrammarBands => Set<GrammarBand>();

    public DbSet<GrammarTopic> GrammarTopics => Set<GrammarTopic>();

    public DbSet<GrammarLesson> GrammarLessons => Set<GrammarLesson>();

    public DbSet<GrammarExample> GrammarExamples => Set<GrammarExample>();

    public DbSet<GrammarExercise> GrammarExercises => Set<GrammarExercise>();

    public DbSet<GrammarAnswer> GrammarAnswers => Set<GrammarAnswer>();

    public DbSet<GrammarRule> GrammarRules => Set<GrammarRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(GrammarDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}