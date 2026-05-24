using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();
builder.Services.AddOpenApi();
builder.Services.AddHttpClient("gateway-proxy");

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origins = builder.Configuration["Gateway:AllowedOrigins"]?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (origins is { Length: > 0 })
        {
            policy.WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod();
            return;
        }

        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");

app.MapGet("/health", () => Results.Ok(new { status = "Gateway is running" }));

app.MapMethods("/api/auth/{**catchAll}", new[] { "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" },
    (HttpContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration) =>
        ProxyRequest(context, httpClientFactory, configuration, "Gateway:Routes:AuthService"));

app.MapMethods("/api/user/{**catchAll}", new[] { "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" },
    (HttpContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration) =>
        ProxyRequest(context, httpClientFactory, configuration, "Gateway:Routes:UserService"));

app.MapMethods("/api/vocabulary/{**catchAll}", new[] { "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" },
    (HttpContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration) =>
        ProxyRequest(context, httpClientFactory, configuration, "Gateway:Routes:VocabularyService"));

app.MapMethods("/api/topics/{**catchAll}", new[] { "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" },
    (HttpContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration) =>
        ProxyRequest(context, httpClientFactory, configuration, "Gateway:Routes:VocabularyService"));

app.MapMethods("/api/bands/{**catchAll}", new[] { "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" },
    (HttpContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration) =>
        ProxyRequest(context, httpClientFactory, configuration, "Gateway:Routes:VocabularyService"));

app.Run();

static async Task ProxyRequest(
    HttpContext context,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    string routeKey)
{
    var downstreamBase = configuration[routeKey];
    if (string.IsNullOrWhiteSpace(downstreamBase))
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new
        {
            message = $"Gateway route '{routeKey}' is not configured."
        });
        return;
    }

    var targetUri = BuildTargetUri(downstreamBase, context.Request);
    using var requestMessage = new HttpRequestMessage(new HttpMethod(context.Request.Method), targetUri);

    CopyHeaders(context, requestMessage);

    if (context.Request.ContentLength > 0 || context.Request.Headers.ContainsKey("Transfer-Encoding"))
    {
        requestMessage.Content = new StreamContent(context.Request.Body);
        if (!string.IsNullOrWhiteSpace(context.Request.ContentType))
        {
            requestMessage.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(context.Request.ContentType);
        }
    }

    var httpClient = httpClientFactory.CreateClient("gateway-proxy");
    using var responseMessage = await httpClient.SendAsync(
        requestMessage,
        HttpCompletionOption.ResponseHeadersRead,
        context.RequestAborted);

    context.Response.StatusCode = (int)responseMessage.StatusCode;

    foreach (var header in responseMessage.Headers)
    {
        context.Response.Headers[header.Key] = header.Value.ToArray();
    }

    foreach (var header in responseMessage.Content.Headers)
    {
        context.Response.Headers[header.Key] = header.Value.ToArray();
    }

    context.Response.Headers.Remove("transfer-encoding");
    await responseMessage.Content.CopyToAsync(context.Response.Body);
}

static string BuildTargetUri(string downstreamBase, HttpRequest request)
{
    var trimmedBase = downstreamBase.TrimEnd('/');
    var path = request.Path.Value ?? string.Empty;
    var queryString = request.QueryString.HasValue ? request.QueryString.Value : string.Empty;
    return $"{trimmedBase}{path}{queryString}";
}

static void CopyHeaders(HttpContext context, HttpRequestMessage requestMessage)
{
    foreach (var header in context.Request.Headers)
    {
        if (string.Equals(header.Key, "Host", StringComparison.OrdinalIgnoreCase))
        {
            continue;
        }

        var added = requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        if (!added)
        {
            requestMessage.Content ??= new StreamContent(Stream.Null);
            requestMessage.Content.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }
    }
}
