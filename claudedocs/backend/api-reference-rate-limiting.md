# PubHub API Rate Limiting Reference

## Overview

All PubHub API endpoints are protected by intelligent rate limiting to prevent abuse, ensure fair usage, and maintain service quality for all users.

## Rate Limiting Strategy

- **IP-based limiting**: For unauthenticated endpoints
- **User-based limiting**: For authenticated endpoints (requires auth token)
- **Automatic cleanup**: Rate limit data is automatically cleaned every 5 minutes
- **Standard headers**: All responses include rate limit information

## Rate Limit Headers

Every API response includes these headers:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699123456789
```

### Header Descriptions

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests allowed in window | `60` |
| `X-RateLimit-Remaining` | Requests remaining in current window | `45` |
| `X-RateLimit-Reset` | Unix timestamp when limit resets | `1699123456789` |

## Rate Limit by Endpoint Type

### OAuth Endpoints

**Endpoints**:
- All OAuth callback and token exchange endpoints

**Limits**:
- **Window**: 1 minute
- **Max Requests**: 10 per IP
- **Purpose**: Prevent brute force attacks on OAuth flow

**Example**:
```
Rate limit: 10 requests per minute per IP
```

### Publishing Endpoints

**Endpoints**:
- `POST /make-server-19ccd85e/posts/publish`

**Limits**:
- **Window**: 1 hour
- **Max Requests**: 20 per user
- **Purpose**: Prevent spam and content abuse

**Example**:
```
Rate limit: 20 posts per hour per user
```

**Note**: Each social media platform may have additional rate limits enforced by the platform itself.

### AI Endpoints

**Endpoints**:
- `POST /make-server-19ccd85e/ai/generate-text`
- `POST /make-server-19ccd85e/ai/chat`

**Limits**:
- **Window**: 1 hour
- **Max Requests**: 50 per user
- **Purpose**: Prevent AI API abuse and control costs

**Example**:
```
Rate limit: 50 AI requests per hour per user
```

### Analytics Endpoints

**Endpoints**:
- All analytics and reporting endpoints

**Limits**:
- **Window**: 1 hour
- **Max Requests**: 100 per user
- **Purpose**: Allow frequent queries while preventing abuse

**Example**:
```
Rate limit: 100 analytics requests per hour per user
```

### Upload Endpoints

**Endpoints**:
- `POST /make-server-19ccd85e/upload/profile-picture`
- `POST /make-server-19ccd85e/upload/project-logo/:projectId`

**Limits**:
- **Window**: 1 minute
- **Max Requests**: 10 per user
- **Purpose**: Prevent storage abuse

**Example**:
```
Rate limit: 10 uploads per minute per user
```

### General API Endpoints

**Endpoints**:
- All other authenticated API endpoints

**Limits**:
- **Window**: 1 minute
- **Max Requests**: 60 per IP
- **Purpose**: General DDoS protection

**Example**:
```
Rate limit: 60 requests per minute per IP
```

### Authentication Endpoints

**Endpoints**:
- Sign-up, sign-in, password reset

**Limits**:
- **Window**: 15 minutes
- **Max Requests**: 5 per IP
- **Purpose**: Prevent brute force authentication attacks

**Example**:
```
Rate limit: 5 auth attempts per 15 minutes per IP
```

## Rate Limit Exceeded Response

When rate limit is exceeded, API returns:

**HTTP Status**: `429 Too Many Requests`

**Headers**:
```http
Retry-After: 30
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699123456789
```

**Response Body**:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 30,
  "limit": 60,
  "windowSeconds": 60
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | Error type identifier |
| `message` | string | Human-readable error message |
| `retryAfter` | number | Seconds until rate limit resets |
| `limit` | number | Maximum requests allowed |
| `windowSeconds` | number | Rate limit window in seconds |

## Client Implementation Guide

### JavaScript/TypeScript Example

```typescript
async function makeAPIRequest(url: string, options: RequestInit) {
  const response = await fetch(url, options);

  // Check rate limit headers
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');

  console.log(`Rate limit: ${remaining}/${limit} remaining`);

  // Handle rate limit exceeded
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.warn(`Rate limited. Retry after ${retryAfter} seconds`);

    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter!) * 1000));
    return makeAPIRequest(url, options);
  }

  return response;
}
```

### Python Example

```python
import requests
import time

def make_api_request(url, **kwargs):
    response = requests.request(**kwargs, url=url)

    # Check rate limit headers
    limit = response.headers.get('X-RateLimit-Limit')
    remaining = response.headers.get('X-RateLimit-Remaining')
    reset = response.headers.get('X-RateLimit-Reset')

    print(f"Rate limit: {remaining}/{limit} remaining")

    # Handle rate limit exceeded
    if response.status_code == 429:
        retry_after = int(response.headers.get('Retry-After', 60))
        print(f"Rate limited. Retrying after {retry_after} seconds")

        time.sleep(retry_after)
        return make_api_request(url, **kwargs)

    return response
```

## Best Practices

### 1. Monitor Rate Limit Headers

Always check `X-RateLimit-Remaining` to avoid hitting limits:

```typescript
const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');

if (remaining < 10) {
  console.warn('Approaching rate limit, slow down requests');
}
```

### 2. Implement Exponential Backoff

When rate limited, use exponential backoff:

```typescript
async function retryWithBackoff(fn: () => Promise<Response>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fn();

    if (response.status !== 429) {
      return response;
    }

    const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
    const delay = retryAfter * 1000 * Math.pow(2, i);

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error('Max retries exceeded');
}
```

### 3. Batch Requests When Possible

Instead of making multiple individual requests, batch them:

```typescript
// Bad: 50 individual requests
for (const post of posts) {
  await publishPost(post);
}

// Good: Batch into fewer requests
const batches = chunk(posts, 10);
for (const batch of batches) {
  await publishBatch(batch);
  await sleep(1000); // Respect rate limits
}
```

### 4. Cache Responses

Cache API responses to reduce request count:

```typescript
const cache = new Map();

async function getCachedData(key: string) {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < 300000) { // 5 minute cache
      return data;
    }
  }

  const response = await fetch(`/api/${key}`);
  const data = await response.json();

  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 5. Handle 429 Gracefully

Always handle rate limit errors gracefully:

```typescript
try {
  const response = await fetch('/api/endpoint');

  if (response.status === 429) {
    const data = await response.json();
    showUserNotification(`Rate limit exceeded. Please wait ${data.retryAfter} seconds.`);
    return;
  }

  // Process successful response
} catch (error) {
  console.error('API request failed:', error);
}
```

## FAQ

### Q: What happens when I exceed the rate limit?

**A**: You receive a `429 Too Many Requests` response with a `Retry-After` header indicating how long to wait before retrying.

### Q: Are rate limits per user or per IP?

**A**: It depends on the endpoint:
- **Authenticated endpoints**: Rate limited per user
- **Unauthenticated endpoints**: Rate limited per IP

### Q: Can I request a higher rate limit?

**A**: For enterprise users or special use cases, contact support to discuss custom rate limits.

### Q: Do rate limits reset immediately after the window?

**A**: Yes, rate limits use sliding windows. The `X-RateLimit-Reset` header shows the exact reset timestamp.

### Q: What if I'm behind a proxy or NAT?

**A**: For authenticated endpoints, rate limiting is user-based, so proxy/NAT doesn't affect you. For unauthenticated endpoints, all users behind the same IP share the rate limit.

### Q: Are there platform-specific rate limits?

**A**: Yes, social media platforms (Twitter, LinkedIn, Facebook, etc.) have their own rate limits independent of PubHub's rate limiting. Check each platform's documentation for details.

## Rate Limit Monitoring

### For Developers

Monitor your rate limit usage:

```typescript
// Check current rate limit status
const response = await fetch('/api/endpoint', {
  headers: { 'Authorization': 'Bearer token' }
});

console.log('Rate limit info:', {
  limit: response.headers.get('X-RateLimit-Limit'),
  remaining: response.headers.get('X-RateLimit-Remaining'),
  resetAt: new Date(parseInt(response.headers.get('X-RateLimit-Reset')!))
});
```

### For System Administrators

Key metrics to monitor:
- 429 response rate by endpoint
- Top rate-limited users/IPs
- Average requests per user
- Rate limit violations over time

## Support

For questions or issues related to rate limiting:
- Check this documentation first
- Review your API usage patterns
- Contact support for assistance with rate limit errors

---

**Last Updated**: 2025-11-09
**API Version**: v1
**Rate Limiter Version**: 1.0.0
