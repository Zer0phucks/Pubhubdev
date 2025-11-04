// Rate limiting middleware for Edge Functions
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

export function rateLimit(config: RateLimitConfig) {
  return async (req: Request, next: () => Promise<Response>) => {
    // Generate rate limit key (default: IP address)
    const key = config.keyGenerator ? 
      config.keyGenerator(req) : 
      req.headers.get('x-forwarded-for') || 
      req.headers.get('x-real-ip') || 
      'unknown';

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create rate limit entry
    let entry = rateLimitStore[key];
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      };
      rateLimitStore[key] = entry;
    }

    // Increment request count
    entry.count++;

    // Check if rate limit exceeded
    if (entry.count > config.maxRequests) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${config.maxRequests} per ${config.windowMs / 1000} seconds`,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, config.maxRequests - entry.count).toString(),
            'X-RateLimit-Reset': entry.resetTime.toString()
          }
        }
      );
    }

    // Continue to next middleware/handler
    const response = await next();

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count).toString());
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

    return response;
  };
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Strict rate limiting for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
    keyGenerator: (req: Request) => {
      // Use IP + User-Agent for more granular limiting
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      return `${ip}:${userAgent}`;
    }
  },

  // Moderate rate limiting for API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    keyGenerator: (req: Request) => {
      // Use IP address for API limiting
      return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    }
  },

  // Lenient rate limiting for file uploads
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
    keyGenerator: (req: Request) => {
      // Use IP address for upload limiting
      return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    }
  },

  // Very strict rate limiting for sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 requests per hour
    keyGenerator: (req: Request) => {
      // Use IP + User-Agent for sensitive operations
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      return `${ip}:${userAgent}`;
    }
  }
};

// Helper function to get client IP
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') || // Cloudflare
         req.headers.get('x-client-ip') ||
         'unknown';
}

// Helper function to check if request is from a trusted source
export function isTrustedSource(req: Request): boolean {
  const clientIP = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || '';
  
  // Add your trusted IP ranges here
  const trustedIPs = [
    '127.0.0.1',
    '::1',
    // Add Vercel IP ranges, Supabase IP ranges, etc.
  ];
  
  // Add trusted user agents (bots, crawlers, etc.)
  const trustedUserAgents = [
    'vercel-bot',
    'supabase-bot',
    // Add other trusted user agents
  ];
  
  return trustedIPs.includes(clientIP) || 
         trustedUserAgents.some(agent => userAgent.toLowerCase().includes(agent));
}
