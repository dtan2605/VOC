using GrammarService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrammarService.Persistence.Configurations;

public class GrammarBandConfiguration
    : IEntityTypeConfiguration<GrammarBand>
{
    public void Configure(
        EntityTypeBuilder<GrammarBand> builder)
    {
        builder.ToTable("GrammarBands");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(500);
    }
}