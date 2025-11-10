/**
 * Hono-Compatible Rate Limiting Middleware
 *
 * Production-ready rate limiter with in-memory storage (suitable for Edge Functions).
 * For distributed systems, consider using Redis or Supabase KV store.
 */

import type { Context, Next } from "npm:hono";

interface RateLimitConfig {
  windowMs: number;           // Time window in milliseconds
  maxRequests: number;        // Maximum requests per window
  keyGenerator?: (c: Context) => string; // Custom key generator function
  message?: string;           // Custom error message
  statusCode?: number;        // HTTP status code (default: 429)
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

// In-memory store for rate limiting
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

/**
 * Get client IP from request context
 */
function getClientIP(c: Context): string {
  const req = c.req;
  return (
    req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.header("x-real-ip") ||
    req.header("cf-connecting-ip") || // Cloudflare
    req.header("x-client-ip") ||
    "unknown"
  );
}

/**
 * Default key generator (IP-based)
 */
function defaultKeyGenerator(c: Context): string {
  return getClientIP(c);
}

/**
 * Create rate limiting middleware for Hono
 */
export function rateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    message = "Too many requests, please try again later",
    statusCode = 429,
  } = config;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore[key];
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore[key] = entry;
    }

    // Increment request count
    entry.count++;

    // Calculate remaining requests
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetAfter = Math.ceil((entry.resetTime - now) / 1000);

    // Set rate limit headers
    c.header("X-RateLimit-Limit", maxRequests.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", entry.resetTime.toString());

    // Check if rate limit exceeded
    if (entry.count > maxRequests) {
      c.header("Retry-After", resetAfter.toString());
      return c.json(
        {
          error: "Rate limit exceeded",
          message,
          retryAfter: resetAfter,
          limit: maxRequests,
          windowSeconds: Math.floor(windowMs / 1000),
        },
        statusCode
      );
    }

    // Continue to next middleware/handler
    await next();
  };
}

/**
 * User-based rate limiter (requires authentication)
 */
export function userRateLimiter(config: RateLimitConfig) {
  const keyGenerator = (c: Context): string => {
    const userId = c.get("userId");
    return userId ? `user:${userId}` : getClientIP(c);
  };

  return rateLimiter({
    ...config,
    keyGenerator,
  });
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // OAuth endpoints - very strict (prevent brute force)
  oauth: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 requests per minute per IP
    message: "Too many OAuth requests, please try again later",
  },

  // Publishing endpoints - moderate (prevent spam)
  publishing: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,          // 20 posts per hour per user
    message: "Publishing rate limit reached, please wait before posting again",
  },

  // AI endpoints - moderate (prevent abuse)
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,          // 50 AI requests per hour per user
    message: "AI request limit reached, please try again later",
  },

  // Analytics endpoints - lenient (frequent queries expected)
  analytics: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,         // 100 requests per hour per user
    message: "Analytics request limit reached, please wait",
  },

  // File upload endpoints - strict (prevent storage abuse)
  upload: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 uploads per minute per user
    message: "Upload rate limit reached, please wait before uploading again",
  },

  // General API endpoints - moderate
  api: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60,          // 60 requests per minute per IP
    message: "API rate limit exceeded, please slow down",
  },

  // Auth endpoints - very strict (prevent brute force)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 auth attempts per 15 minutes
    message: "Too many authentication attempts, please try again later",
  },
};

/**
 * Helper: Check if request is from trusted source
 */
export function isTrustedSource(c: Context): boolean {
  const clientIP = getClientIP(c);
  const userAgent = c.req.header("user-agent") || "";

  // Trusted IP ranges (add your production IPs)
  const trustedIPs = [
    "127.0.0.1",
    "::1",
    // Add Vercel, Supabase, monitoring service IPs
  ];

  // Trusted user agents
  const trustedUserAgents = [
    "vercel-bot",
    "supabase-bot",
    "uptimerobot",
  ];

  return (
    trustedIPs.includes(clientIP) ||
    trustedUserAgents.some((agent) =>
      userAgent.toLowerCase().includes(agent.toLowerCase())
    )
  );
}

/**
 * Conditional rate limiter (skips trusted sources)
 */
export function conditionalRateLimiter(config: RateLimitConfig) {
  const limiter = rateLimiter(config);

  return async (c: Context, next: Next) => {
    // Skip rate limiting for trusted sources
    if (isTrustedSource(c)) {
      await next();
      return;
    }

    // Apply rate limiting
    await limiter(c, next);
  };
}
