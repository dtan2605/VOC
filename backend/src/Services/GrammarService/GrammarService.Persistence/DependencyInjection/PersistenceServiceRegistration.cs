using GrammarService.Domain.Interfaces;
using GrammarService.Persistence.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace GrammarService.Persistence.DependencyInjection;

public static class PersistenceServiceRegistration
{
    public static IServiceCollection
        AddPersistence(this IServiceCollection services)
    {
        services.AddScoped<
            IGrammarBandRepository,
            GrammarBandRepository>();

        return services;
    }
}