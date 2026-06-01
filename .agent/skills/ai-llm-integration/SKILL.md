---
name: ai-llm-integration
description: LLM API integration with OpenAI, Anthropic Claude, and Google Gemini. Includes prompt engineering, streaming, function calling, and RAG patterns
tags: [ai, llm, openai, anthropic, gemini, rag]
author: Antigravity Team
version: 1.0.0
---

# LLM Integration Skill

Integrate AI language models into your applications.

## OpenAI Integration

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Basic completion
async function chat(messages) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    temperature: 0.7,
    max_tokens: 1000
  });
  return response.choices[0].message.content;
}

// Streaming
async function* chatStream(messages) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    stream: true
  });
  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content || '';
  }
}

// Function Calling
const tools = [{
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' }
      },
      required: ['location']
    }
  }
}];

const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [{ role: 'user', content: 'What\'s the weather in Tokyo?' }],
  tools,
  tool_choice: 'auto'
});
```

## Anthropic Claude

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function chat(prompt) {
  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });
  return response.content[0].text;
}

// With system prompt
async function chatWithSystem(system, userMessage) {
  return anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: userMessage }]
  });
}
```

## Google Gemini

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function chat(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Multi-turn conversation
async function conversation() {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: 'Hello' }] },
      { role: 'model', parts: [{ text: 'Hi there!' }] }
    ]
  });
  const result = await chat.sendMessage('Tell me a joke');
  return result.response.text();
}
```

## Prompt Engineering

```javascript
// System prompts
const SYSTEM_PROMPTS = {
  codeReview: `You are an expert code reviewer. Analyze the code for:
- Bugs and edge cases
- Performance issues
- Security vulnerabilities
- Best practice violations
Provide specific, actionable feedback with code examples.`,

  jsonOutput: `You are a helpful assistant that ONLY responds in valid JSON.
Never include any text outside the JSON object.
Schema: { "answer": string, "confidence": number }`
};

// Few-shot prompting
const fewShotMessages = [
  { role: 'system', content: 'Classify the sentiment of text.' },
  { role: 'user', content: 'I love this product!' },
  { role: 'assistant', content: 'positive' },
  { role: 'user', content: 'This is terrible.' },
  { role: 'assistant', content: 'negative' },
  { role: 'user', content: userInput }
];
```

## RAG Pattern

```javascript
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';

// Index documents
async function indexDocuments(documents) {
  const embeddings = new OpenAIEmbeddings();
  await PineconeStore.fromDocuments(documents, embeddings, {
    pineconeIndex: index,
    namespace: 'my-docs'
  });
}

// RAG query
async function ragQuery(question) {
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await PineconeStore.fromExisting(embeddings, {
    pineconeIndex: index
  });
  
  // Retrieve relevant docs
  const docs = await vectorStore.similaritySearch(question, 4);
  const context = docs.map(d => d.pageContent).join('\n\n');
  
  // Generate answer with context
  return openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: `Answer based on context:\n${context}` },
      { role: 'user', content: question }
    ]
  });
}
```

## Best Practices

1. **Rate Limiting**: Implement exponential backoff
2. **Caching**: Cache responses for identical prompts
3. **Streaming**: Use SSE for real-time responses
4. **Error Handling**: Handle API errors gracefully
5. **Cost Monitoring**: Track token usage
