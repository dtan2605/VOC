using AuthService.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence;

public sealed class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<RefreshTokenEntity> RefreshTokens => Set<RefreshTokenEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Roles).HasDefaultValue("User");
        });

        modelBuilder.Entity<RefreshTokenEntity>(entity =>
        {
            entity.HasIndex(rt => rt.Token).IsUnique();
            entity.Property(rt => rt.IsRevoked).HasDefaultValue(false);
        });
    }
}
