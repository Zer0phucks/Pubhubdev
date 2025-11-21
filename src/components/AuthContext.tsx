import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';
import { API_URL, registerAuthTokenProvider, setAuthToken } from '../utils/api';
import { logger } from '../utils/logger';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    profilePicture?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  profilePicture: string | null;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  signinWithGoogle: () => Promise<void>;
  signinWithFacebook: () => Promise<void>;
  signinWithTwitter: () => Promise<void>;
  signout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

type DemoUserRecord = {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
};

type DemoSessionRecord = {
  userId: string;
  token: string;
};

const DEMO_USERS_KEY = 'pubhub::demo-users';
const DEMO_SESSION_KEY = 'pubhub::demo-session';
const isBrowser = typeof window !== 'undefined';

const defaultDemoFlag = import.meta.env.DEV ? 'true' : 'false';
const useDemoAuth =
  (import.meta.env.VITE_DEMO_MODE ?? defaultDemoFlag).toLowerCase() === 'true';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Clerk hooks
  const { isSignedIn, userId: clerkUserId, getToken: getClerkToken, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: clerkUserLoaded } = useClerkUser();

  const baseUrl = API_URL;

  // Register auth token provider for API calls
  useEffect(() => {
    if (useDemoAuth) {
      registerAuthTokenProvider(null);
      return;
    }

    registerAuthTokenProvider(async () => {
      try {
        const token = await getClerkToken();
        return token;
      } catch (error) {
        logger.error('Failed to get Clerk token', error);
        return null;
      }
    });

    return () => {
      registerAuthTokenProvider(null);
    };
  }, [getClerkToken]);

  // Sync Clerk user state with local user state
  useEffect(() => {
    if (useDemoAuth) {
      setLoading(false);
      return;
    }

    if (!clerkUserLoaded) {
      setLoading(true);
      return;
    }

    setLoading(false);

    if (isSignedIn && clerkUser) {
      const mappedUser: User = {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        user_metadata: {
          name: clerkUser.fullName || clerkUser.firstName || undefined,
          profilePicture: clerkUser.imageUrl || undefined,
        },
      };
      setUser(mappedUser);
      setProfilePicture(clerkUser.imageUrl || null);

      // Get token and set it
      getClerkToken().then((token) => {
        if (token) {
          setAuthToken(token);
        }
      });

      // Initialize user profile on backend if needed
      initializeUserProfile();
    } else {
      setUser(null);
      setProfilePicture(null);
      setAuthToken(null);
    }
  }, [isSignedIn, clerkUser, clerkUserLoaded, getClerkToken]);

  // Initialize user profile on backend
  const initializeUserProfile = async () => {
    if (!isSignedIn || !clerkUser) return;

    try {
      const token = await getClerkToken();
      if (!token) return;

      const response = await fetch(`${baseUrl}/auth/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user?.profilePicture) {
          setProfilePicture(data.user.profilePicture);
        }
      }
    } catch (error) {
      logger.error('Failed to initialize user profile', error);
    }
  };

  // Demo auth functions (unchanged)
  const loadDemoUsers = (): DemoUserRecord[] => {
    if (!isBrowser) return [];
    try {
      const raw = localStorage.getItem(DEMO_USERS_KEY);
      return raw ? (JSON.parse(raw) as DemoUserRecord[]) : [];
    } catch (error) {
      logger.error('Failed to parse demo users', error);
      return [];
    }
  };

  const persistDemoUsers = (records: DemoUserRecord[]) => {
    if (!isBrowser) return;
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(records));
  };

  const readDemoSession = (): DemoSessionRecord | null => {
    if (!isBrowser) return null;
    try {
      const raw = localStorage.getItem(DEMO_SESSION_KEY);
      return raw ? (JSON.parse(raw) as DemoSessionRecord) : null;
    } catch (error) {
      logger.error('Failed to parse demo session', error);
      return null;
    }
  };

  const persistDemoSession = (session: DemoSessionRecord | null) => {
    if (!isBrowser) return;
    if (session) {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
  };

  const mapDemoUserToAuthUser = (record: DemoUserRecord): User => ({
    id: record.id,
    email: record.email,
    user_metadata: {
      name: record.name,
    },
  });

  const createDemoToken = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `demo-${crypto.randomUUID()}`;
    }
    return `demo-${Math.random().toString(36).slice(2)}`;
  };

  const demoSignup = (email: string, password: string, name: string) => {
    const records = loadDemoUsers();
    if (records.some((record) => record.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('User already registered');
    }

    const newRecord: DemoUserRecord = {
      id: crypto.randomUUID(),
      email,
      password,
      name,
      createdAt: new Date().toISOString(),
    };

    records.push(newRecord);
    persistDemoUsers(records);

    const session: DemoSessionRecord = {
      userId: newRecord.id,
      token: createDemoToken(),
    };
    persistDemoSession(session);

    const mappedUser = mapDemoUserToAuthUser(newRecord);
    setUser(mappedUser);
    setAuthToken(session.token);
  };

  const demoSignin = (email: string, password: string) => {
    const records = loadDemoUsers();
    const existing = records.find(
      (record) => record.email.toLowerCase() === email.toLowerCase(),
    );

    if (!existing || existing.password !== password) {
      throw new Error('Invalid email or password');
    }

    const session: DemoSessionRecord = {
      userId: existing.id,
      token: createDemoToken(),
    };

    persistDemoSession(session);
    const mappedUser = mapDemoUserToAuthUser(existing);
    setUser(mappedUser);
    setAuthToken(session.token);
  };

  // Check for existing demo session on mount
  useEffect(() => {
    if (useDemoAuth) {
      const session = readDemoSession();
      if (session) {
        const records = loadDemoUsers();
        const current = records.find((record) => record.id === session.userId);
        if (current) {
          setUser(mapDemoUserToAuthUser(current));
          setAuthToken(session.token);
        }
      }
      setLoading(false);
    }
  }, []);

  const refreshProfile = async () => {
    if (useDemoAuth) {
      return;
    }

    if (!isSignedIn || !clerkUser) {
      logger.warn('Cannot refresh profile: no user authenticated');
      return;
    }

    try {
      const token = await getClerkToken();
      if (!token) {
        logger.warn('No token available for profile refresh');
        return;
      }

      const response = await fetch(`${baseUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user?.profilePicture) {
          setProfilePicture(data.user.profilePicture);
          if (user) {
            setUser({
              ...user,
              user_metadata: {
                ...user.user_metadata,
                profilePicture: data.user.profilePicture,
              },
            });
          }
        }
      } else {
        logger.error('Failed to refresh profile', new Error(`HTTP ${response.status}: ${response.statusText}`), {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      logger.error('Error refreshing profile', error);
    }
  };

  const signin = async (email: string, password: string) => {
    if (useDemoAuth) {
      demoSignin(email, password);
      return;
    }

    // Clerk handles sign-in through their UI components
    // This function is kept for compatibility but should redirect to Clerk sign-in
    throw new Error('Please use the sign-in button to authenticate with Clerk');
  };

  const signup = async (email: string, password: string, name: string) => {
    if (useDemoAuth) {
      demoSignup(email, password, name);
      return;
    }

    // Clerk handles sign-up through their UI components
    // This function is kept for compatibility but should redirect to Clerk sign-up
    throw new Error('Please use the sign-up button to register with Clerk');
  };

  const signout = async () => {
    if (useDemoAuth) {
      persistDemoSession(null);
      setUser(null);
      setAuthToken(null);
      return;
    }

    await clerkSignOut();
    setUser(null);
    setAuthToken(null);
  };

  const getToken = async () => {
    if (useDemoAuth) {
      const session = readDemoSession();
      return session?.token ?? null;
    }

    try {
      return await getClerkToken();
    } catch (error) {
      logger.error('Failed to get Clerk token', error);
      return null;
    }
  };

  // OAuth sign-in methods - Clerk handles these through their components
  // These are kept for compatibility but should use Clerk's OAuth buttons
  const signinWithGoogle = async () => {
    // Redirect to Clerk's OAuth flow
    window.location.href = '/sign-in?oauth=google';
  };

  const signinWithFacebook = async () => {
    window.location.href = '/sign-in?oauth=facebook';
  };

  const signinWithTwitter = async () => {
    window.location.href = '/sign-in?oauth=twitter';
  };

  // Load profile picture on mount
  useEffect(() => {
    if (user && !useDemoAuth) {
      refreshProfile();
    }
  }, [user?.id, isSignedIn]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        profilePicture,
        signin,
        signout,
        signup,
        signinWithGoogle,
        signinWithFacebook,
        signinWithTwitter,
        getToken,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
