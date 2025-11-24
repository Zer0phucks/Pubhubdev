import { Context } from 'hono';
import { AuthUser } from './middleware/auth';

// Extend Hono Context with our custom variables
export interface AppContext {
  Variables: {
    userId: string;
    user: AuthUser;
    clerkUserId: string;
  };
}

export type AppContextType = Context<AppContext>;

