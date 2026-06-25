using System.Net.WebSockets;

namespace ApiGateway.Middleware;

public class WebSocketProxyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public WebSocketProxyMiddleware(RequestDelegate next, IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _next = next;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/api/speaking") && 
            context.WebSockets.IsWebSocketRequest)
        {
            await ProxyWebSocket(context);
            return;
        }

        await _next(context);
    }

    private async Task ProxyWebSocket(HttpContext context)
    {
        var downstreamBase = _configuration["Gateway:Routes:SpeakingService"];
        if (string.IsNullOrWhiteSpace(downstreamBase))
        {
            throw new InvalidOperationException("SpeakingService route is not configured in Gateway:Routes:SpeakingService");
        }

        // Convert http(s):// to ws(s):// for WebSocket connections
        var wsBase = downstreamBase
            .Replace("https://", "wss://")
            .Replace("http://", "ws://");
        var upstreamUri = new Uri($"{wsBase.TrimEnd('/')}{context.Request.Path.Value}");

        using var webSocketConnection = await context.WebSockets.AcceptWebSocketAsync();
        using var clientWebSocket = new ClientWebSocket();

        try
        {
            await clientWebSocket.ConnectAsync(upstreamUri, context.RequestAborted);
            await ForwardWebSockets(webSocketConnection, clientWebSocket, context.RequestAborted);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"WebSocket proxy error: {ex.Message}");
            if (webSocketConnection.State == WebSocketState.Open)
            {
                await webSocketConnection.CloseAsync(
                    WebSocketCloseStatus.InternalServerError, 
                    "Internal server error", 
                    context.RequestAborted);
            }
        }
    }

    private async Task ForwardWebSockets(
        WebSocket clientSocket, 
        ClientWebSocket serverSocket, 
        CancellationToken cancellationToken)
    {
        var tasks = new[]
        {
            ForwardFromClientToServer(clientSocket, serverSocket, cancellationToken),
            ForwardFromServerToClient(serverSocket, clientSocket, cancellationToken)
        };

        await Task.WhenAny(tasks);

        // Close both sides when one side closes
        if (clientSocket.State == WebSocketState.Closed)
            await serverSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, null, cancellationToken);
        if (serverSocket.State == WebSocketState.CloseReceived)
            await clientSocket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, null, cancellationToken);
    }

    private async Task ForwardFromClientToServer(
        WebSocket clientSocket,
        ClientWebSocket serverSocket,
        CancellationToken cancellationToken)
    {
        var buffer = new ArraySegment<byte>(new byte[4096]);
        try
        {
            while (serverSocket.State == WebSocketState.Open)
            {
                var result = await clientSocket.ReceiveAsync(buffer, cancellationToken);
                var trimmedBuffer = new ArraySegment<byte>(buffer.Array!, buffer.Offset, result.Count);
                await serverSocket.SendAsync(trimmedBuffer, result.MessageType, result.EndOfMessage, cancellationToken);

                if (result.MessageType == WebSocketMessageType.Close)
                    break;
            }
        }
        catch
        {
        }
    }

    private async Task ForwardFromServerToClient(
        ClientWebSocket serverSocket,
        WebSocket clientSocket,
        CancellationToken cancellationToken)
    {
        var buffer = new ArraySegment<byte>(new byte[4096]);
        try
        {
            while (serverSocket.State == WebSocketState.Open)
            {
                var result = await serverSocket.ReceiveAsync(buffer, cancellationToken);
                var trimmedBuffer = new ArraySegment<byte>(buffer.Array!, buffer.Offset, result.Count);
                await clientSocket.SendAsync(trimmedBuffer, result.MessageType, result.EndOfMessage, cancellationToken);

                if (result.MessageType == WebSocketMessageType.Close)
                    break;
            }
        }
        catch
        {
        }
    }
}
