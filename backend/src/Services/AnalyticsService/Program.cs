using AnalyticsService.API.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var conn = builder.Configuration.GetConnectionString("DefaultConnection") ?? builder.Configuration["ANALYTICS_DB"];
if (!string.IsNullOrEmpty(conn))
{
    builder.Services.AddDbContext<AnalyticsDbContext>(options =>
        options.UseMySql(conn, ServerVersion.AutoDetect(conn)));
}
else
{
    // Enforce MySQL for production; if not provided, fail fast to avoid accidental SQLite usage.
    throw new InvalidOperationException("ANALYTICS_DB connection string is required and must point to a MySQL server.");
}

builder.Services.AddHostedService<AnalyticsService.API.Services.AnalyticsAggregator>();

builder.Services.AddHttpClient("learning-service", (serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var baseUrl = configuration["DownstreamServices:LearningServiceBaseUrl"];
    if (string.IsNullOrWhiteSpace(baseUrl))
    {
        baseUrl = "http://localhost:5062"; // default LearningService port in dev
    }

    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(5);
    var token = configuration["INTERNAL_API_KEY"];
    if (!string.IsNullOrWhiteSpace(token))
    {
        client.DefaultRequestHeaders.Add("X-Service-Token", token);
    }
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.MapControllers();

// Ensure database migrations are applied on startup (best-effort)
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AnalyticsDbContext>();
    db.Database.Migrate();
}
catch (Exception ex)
{
    // Log migration failure to console; service will still start but endpoints may fail.
    Console.WriteLine($"Warning: failed to apply analytics migrations: {ex.Message}");
}

app.Run();
