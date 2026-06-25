# Frontend Setup for Groq-based Speech Service

## Configuration

The frontend automatically connects to the backend speech service via WebSocket. No additional configuration needed.

## API Endpoint

The frontend uses WebSocket at:
- **Development**: `ws://localhost:8000/api/speaking/ws`
- **Production**: `wss://your-domain.com/api/speaking/ws`

## Environment Variables

If you need to customize the backend connection, update `frontend/.env`:

```env
# API Base URL (optional, uses relative path by default)
VITE_API_BASE_URL=
```

### For Docker Deployment

When using Docker, make sure the frontend can connect to the speech service:

1. **Docker Compose** - Update `docker-compose.yml`:
```yaml
services:
  frontend:
    environment:
      - VITE_API_BASE_URL=/api
    # ... other config
  speech-service:
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
```

2. **nginx** - Update proxy configuration:
```nginx
location /api/speaking {
    proxy_pass http://speech-service:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## Testing

1. **Start the backend service**:
```bash
cd ai-services/services/speech-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

2. **Start the frontend**:
```bash
cd frontend
npm install
npm run dev
```

3. **Access the application**:
   - Open http://localhost:5173
   - Navigate to the Speaking page
   - Start conversation by clicking the orb

## Features

- **Real-time conversation**: WebSocket-based interaction
- **Audio recording**: Browser native MediaRecorder
- **Speech-to-text**: Uses Whisper (backend)
- **AI response**: Uses Groq (llama3) as AI partner
- **Text-to-speech**: Uses Kokoro for responses
- **Conversation memory**: Maintains context across turns

## Troubleshooting

### Connection Failed
- Ensure backend is running on port 8000
- Check browser console for error messages
- Verify WebSocket connection is allowed

### No Response from AI
- Verify Groq API key is set in backend `.env`
- Check backend logs for API errors
- Ensure model is available and accessible

### Audio Issues
- Check microphone permissions in browser
- Verify audio device is selected
- Test with different browsers if needed

### Performance Issues
- Adjust TTS speed in backend `.env`
- Reduce conversation length if needed
- Clear browser cache if problems persist
