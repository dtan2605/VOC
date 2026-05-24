using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace VocabularyService.Persistence;

public sealed class VocabularyDbContextFactory : IDesignTimeDbContextFactory<VocabularyDbContext>
{
    public VocabularyDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<VocabularyDbContext>();
        var connectionString = "Server=localhost;Port=3309;Database=voc_vocabulary;User=voc_user;Password=ChangeMe123!;";
        optionsBuilder.UseMySql(connectionString, ServerVersion.Parse("10.11.0-mysql"));
        return new VocabularyDbContext(optionsBuilder.Options);
    }
}
