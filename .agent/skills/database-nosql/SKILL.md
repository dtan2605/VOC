---
name: database-nosql
description: NoSQL database patterns with MongoDB, Redis, and DynamoDB including data modeling and caching strategies
tags: [nosql, mongodb, redis, dynamodb, database]
author: Antigravity Team
version: 1.0.0
---

# NoSQL Database Skill

NoSQL database design and operations.

## MongoDB

### Schema Design
```javascript
// User with embedded profile
const UserSchema = {
  _id: ObjectId,
  email: String,
  password: String,
  profile: {
    firstName: String,
    lastName: String,
    avatar: String
  },
  settings: {
    notifications: Boolean,
    theme: String
  },
  createdAt: Date,
  updatedAt: Date
};

// Posts with references
const PostSchema = {
  _id: ObjectId,
  authorId: ObjectId,  // Reference to User
  title: String,
  content: String,
  tags: [String],
  comments: [{
    userId: ObjectId,
    text: String,
    createdAt: Date
  }],
  likes: [ObjectId],
  createdAt: Date
};
```

### Queries
```javascript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('myapp');

// Find with projection
const users = await db.collection('users').find(
  { 'profile.age': { $gte: 18 } },
  { projection: { password: 0 } }
).sort({ createdAt: -1 }).limit(20).toArray();

// Aggregation
const stats = await db.collection('posts').aggregate([
  { $match: { createdAt: { $gte: new Date('2024-01-01') } } },
  { $group: {
      _id: '$authorId',
      postCount: { $sum: 1 },
      avgLikes: { $avg: { $size: '$likes' } }
  }},
  { $sort: { postCount: -1 } },
  { $limit: 10 }
]).toArray();

// Text search
await db.collection('posts').createIndex({ title: 'text', content: 'text' });
const results = await db.collection('posts').find(
  { $text: { $search: 'javascript tutorial' } },
  { score: { $meta: 'textScore' } }
).sort({ score: { $meta: 'textScore' } }).toArray();
```

## Redis

### Caching
```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache-aside pattern
async function getCachedUser(userId) {
  const cacheKey = `user:${userId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from DB
  const user = await db.users.findById(userId);
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(user));
  
  return user;
}

// Rate limiting
async function checkRateLimit(userId, limit = 100) {
  const key = `ratelimit:${userId}:${Date.now() / 60000 | 0}`;
  const count = await redis.incr(key);
  
  if (count === 1) await redis.expire(key, 60);
  
  return count <= limit;
}

// Session storage
async function setSession(sessionId, data, ttl = 86400) {
  await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
}

// Pub/Sub
const subscriber = new Redis(process.env.REDIS_URL);
subscriber.subscribe('notifications');
subscriber.on('message', (channel, message) => {
  console.log(`Received: ${message}`);
});

await redis.publish('notifications', JSON.stringify({ type: 'alert', data: {} }));
```

## DynamoDB

```javascript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Single table design
const TableSchema = {
  PK: 'USER#userId',      // Partition key
  SK: 'PROFILE',          // Sort key
  // or SK: 'POST#postId' for posts
};

// Get item
const user = await docClient.send(new GetCommand({
  TableName: 'MyApp',
  Key: { PK: `USER#${userId}`, SK: 'PROFILE' }
}));

// Query user's posts
const posts = await docClient.send(new QueryCommand({
  TableName: 'MyApp',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
  ExpressionAttributeValues: {
    ':pk': `USER#${userId}`,
    ':sk': 'POST#'
  },
  ScanIndexForward: false,
  Limit: 20
}));
```

## Best Practices

1. **Denormalize** for read performance
2. **Use indexes** appropriately
3. **Set TTLs** for temporary data
4. **Handle connection pooling**
