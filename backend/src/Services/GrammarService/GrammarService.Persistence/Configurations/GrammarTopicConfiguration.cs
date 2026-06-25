using GrammarService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrammarService.Persistence.Configurations;

public class GrammarTopicConfiguration
    : IEntityTypeConfiguration<GrammarTopic>
{
    public void Configure(
        EntityTypeBuilder<GrammarTopic> builder)
    {
        builder.ToTable("GrammarTopics");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasOne(x => x.Band)
            .WithMany(x => x.Topics)
            .HasForeignKey(x => x.BandId);
    }
}