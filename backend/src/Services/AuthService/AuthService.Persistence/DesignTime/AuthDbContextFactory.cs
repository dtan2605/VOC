using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AuthService.Persistence;

public sealed class AuthDbContextFactory : IDesignTimeDbContextFactory<AuthDbContext>
{
    public AuthDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AuthDbContext>();
        var connectionString = "Server=localhost;Port=3308;Database=voc_auth;User=root;Password=ChangeMe123!;";
        optionsBuilder.UseMySql(connectionString, ServerVersion.Parse("10.11.0-mysql"));
        return new AuthDbContext(optionsBuilder.Options);
    }
}
