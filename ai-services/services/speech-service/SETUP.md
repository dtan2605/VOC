# Speech Service with Groq AI - Setup Guide

This service has been updated to use Groq API (free AI) instead of Ollama.

## Prerequisites

1. **Get a Groq API Key** (Free Tier Available)
   - Visit: https://console.groq.com/
   - Sign up for free
   - Generate an API key in your console
   - The free tier includes 14,000 request/day

2. **Install Required Dependencies**
   ```bash
   cd ai-services/services/speech-service
   pip install -r requirements.txt
   ```

## Configuration

1. **Set your Groq API Key**
   ```bash
   # On Linux/Mac
   export GROQ_API_KEY="your_groq_api_key_here"

   # On Windows (PowerShell)
   $env:GROQ_API_KEY="your_groq_api_key_here"
   ```

2. **Or add to .env file**
   ```bash
   cp .env.example .env
   # Edit .env and add your Groq API key
   ```

## Model Selection

The service uses `llama3-8b-8192` by default (optimized for conversational tasks and free tier).

Other Groq models you can use:
- `llama3-8b-8192` - Default, balanced performance
- `llama3-70b-8192` - More capable, higher cost
- `mixtral-8x7b-32768` - Mixed model, good performance

To change, update the `.env` file:
```
GROQ_MODEL=llama3-70b-8192
```

## Running the Service

### Development Mode
```bash
cd ai-services/services/speech-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker Mode
```bash
cd ai-services/services/speech-service
docker build -t speech-service .
docker run -p 8000:8000 \
  -e GROQ_API_KEY="your_groq_api_key" \
  -e SPEECH_DB_HOST=db \
  -e SPEECH_DB_PORT=3306 \
  speech-service
```

## Testing

1. **Check health endpoint**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Create a speaking session**
   ```bash
   curl -X POST http://localhost:8000/api/speaking/sessions \
     -H "Content-Type: application/json" \
     -d '{
       "part": "part_1",
       "topic": "travel",
       "autoSpeak": true,
       "userGoal": "Improve fluency"
     }'
   ```

## Features

- **STT**: Whisper for speech-to-text
- **AI Conversation**: Groq (llama3) for natural conversation
- **TTS**: Kokoro for text-to-speech
- **Memory**: Conversation memory for context awareness
- **Real-time**: WebSocket support for live conversation
- **Scoring**: IELTS-style speaking assessment

## Troubleshooting

### Groq API Key Not Found
- Make sure `GROQ_API_KEY` is set in environment variables
- Check that the key is valid and not expired
- Verify you're using the correct model

### Connection Errors
- Ensure Groq API is accessible (check firewall settings)
- Verify the service is running on port 8000
- Check Docker container network configuration

### Performance Issues
- Use smaller models for faster responses
- Adjust TTS speed and word limits in `.env`
- Monitor API rate limits for free tier

## Next Steps

1. Test the service with the frontend
2. Monitor performance and adjust settings
3. Consider implementing caching for frequently used responses
4. Set up proper logging and monitoring
