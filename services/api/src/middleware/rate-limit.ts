import { Context, Next } from 'hono';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: Context) => string;
  message?: string;
  statusCode?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

const rateLimitStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

function getClientIP(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-client-ip') ||
    'unknown'
  );
}

function defaultKeyGenerator(c: Context): string {
  return getClientIP(c);
}

export function rateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    message = 'Too many requests, please try again later',
    statusCode = 429,
  } = config;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const now = Date.now();

    let entry = rateLimitStore[key];
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore[key] = entry;
    }

    entry.count++;

    const remaining = Math.max(0, maxRequests - entry.count);
    const resetAfter = Math.ceil((entry.resetTime - now) / 1000);

    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', entry.resetTime.toString());

    if (entry.count > maxRequests) {
      c.header('Retry-After', resetAfter.toString());
      return c.json(
        {
          error: 'Rate limit exceeded',
          message,
          retryAfter: resetAfter,
          limit: maxRequests,
          windowSeconds: Math.floor(windowMs / 1000),
        },
        statusCode
      );
    }

    await next();
  };
}

export function userRateLimiter(config: RateLimitConfig) {
  const keyGenerator = (c: Context): string => {
    const userId = c.get('userId');
    return userId ? `user:${userId}` : getClientIP(c);
  };

  return rateLimiter({
    ...config,
    keyGenerator,
  });
}

export const rateLimitConfigs = {
  oauth: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Too many OAuth requests, please try again later',
  },
  publishing: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
    message: 'Publishing rate limit reached, please wait before posting again',
  },
  ai: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 50,
    message: 'AI request limit reached, please try again later',
  },
  analytics: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 100,
    message: 'Analytics request limit reached, please wait',
  },
  upload: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Upload rate limit reached, please wait before uploading again',
  },
  api: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: 'API rate limit exceeded, please slow down',
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later',
  },
};

