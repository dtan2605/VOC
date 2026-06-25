using GrammarService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrammarService.Persistence.Configurations;

public class GrammarLessonConfiguration
    : IEntityTypeConfiguration<GrammarLesson>
{
    public void Configure(
        EntityTypeBuilder<GrammarLesson> builder)
    {
        builder.ToTable("GrammarLessons");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(x => x.Theory)
            .HasColumnType("longtext");

        builder.Property(x => x.Formula)
            .HasMaxLength(500);

        builder.HasOne(x => x.Topic)
            .WithMany(x => x.Lessons)
            .HasForeignKey(x => x.TopicId);
    }
}