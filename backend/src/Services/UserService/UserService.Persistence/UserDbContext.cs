using Microsoft.EntityFrameworkCore;
using UserService.Persistence.Entities;

namespace UserService.Persistence;

public sealed class UserDbContext : DbContext
{
    public UserDbContext(DbContextOptions<UserDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserProfileEntity> UserProfiles => Set<UserProfileEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserProfileEntity>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Roles).HasDefaultValue("User");
        });

        modelBuilder.Entity<UserProfileEntity>().HasData(
            new UserProfileEntity
            {
                Id = 1,
                Email = "welcome@voc.local",
                FullName = "VOC Sample User",
                Roles = "User",
                CreatedAt = DateTime.UtcNow
            }
        );
    }
}
