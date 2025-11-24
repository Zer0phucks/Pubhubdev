import { Context, Next } from 'hono';
import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
const clerkClient = clerkSecretKey
  ? createClerkClient({ secretKey: clerkSecretKey })
  : null;

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  profilePicture?: string;
}

export interface AppContext {
  Variables: {
    userId: string;
    user: AuthUser;
    clerkUserId: string;
  };
}

/**
 * Authentication middleware for Hono
 * Verifies Clerk JWT tokens and sets user context
 */
export async function requireAuth(c: Context<AppContext>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized - No authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  if (!clerkClient) {
    console.error('Clerk client not initialized');
    return c.json({ error: 'Authentication service unavailable' }, 503);
  }

  try {
    const verified = await clerkClient.verifyToken(token);
    const clerkUser = await clerkClient.users.getUser(verified.sub);

    const user: AuthUser = {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      name: clerkUser.fullName || clerkUser.firstName || undefined,
      profilePicture: clerkUser.imageUrl || undefined,
    };

    c.set('userId', user.id);
    c.set('user', user);
    c.set('clerkUserId', clerkUser.id);

    await next();
  } catch (error: any) {
    console.error('Clerk token verification failed', error);
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
}

/**
 * Optional auth middleware - sets user if token is valid, but doesn't require it
 */
export async function optionalAuth(c: Context<AppContext>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !clerkClient) {
    await next();
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const verified = await clerkClient.verifyToken(token);
    const clerkUser = await clerkClient.users.getUser(verified.sub);

    const user: AuthUser = {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      name: clerkUser.fullName || clerkUser.firstName || undefined,
      profilePicture: clerkUser.imageUrl || undefined,
    };

    c.set('userId', user.id);
    c.set('user', user);
    c.set('clerkUserId', clerkUser.id);
  } catch (error) {
    // Silently fail for optional auth
    console.debug('Optional auth failed', error);
  }

  await next();
}

