using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace LearningService.Persistence;

public sealed class LearningDbContextFactory : IDesignTimeDbContextFactory<LearningDbContext>
{
    public LearningDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<LearningDbContext>();
        var connectionString = "Server=localhost;Port=3309;Database=voc_learning;User=voc_user;Password=ChangeMe123!;";
        optionsBuilder.UseMySql(connectionString, ServerVersion.Parse("10.11.0-mysql"));
        return new LearningDbContext(optionsBuilder.Options);
    }
}
