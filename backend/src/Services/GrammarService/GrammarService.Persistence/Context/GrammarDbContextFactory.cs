using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GrammarService.Persistence.Context;

public class GrammarDbContextFactory
    : IDesignTimeDbContextFactory<GrammarDbContext>
{
    public GrammarDbContext CreateDbContext(string[] args)
    {
        Console.WriteLine("=== USING DESIGN TIME FACTORY ===");

        var connectionString =
            "server=localhost;port=3309;database=voc_grammar;user=root;password=password;";

        var optionsBuilder =
            new DbContextOptionsBuilder<GrammarDbContext>();

        optionsBuilder.UseMySql(
            connectionString,
            new MySqlServerVersion(new Version(8, 0, 36)));

        return new GrammarDbContext(optionsBuilder.Options);
    }
}