using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace UserService.Persistence;

public sealed class UserDbContextFactory : IDesignTimeDbContextFactory<UserDbContext>
{
    public UserDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<UserDbContext>();
        var connectionString = "Server=localhost;Port=3308;Database=voc_user;User=voc_user;Password=ChangeMe123!;";
        optionsBuilder.UseMySql(connectionString, ServerVersion.Parse("10.11.0-mysql"));
        return new UserDbContext(optionsBuilder.Options);
    }
}
