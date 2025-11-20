import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
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

  const baseUrl = API_URL;

  useEffect(() => {
    if (useDemoAuth) {
      registerAuthTokenProvider(null);
      return;
    }

    registerAuthTokenProvider(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    });

    return () => {
      registerAuthTokenProvider(null);
    };
  }, []);

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

  // Fetch user profile with profile picture
  const refreshProfile = async () => {
    if (useDemoAuth) {
      return;
    }

    if (!user) {
      logger.warn('Cannot refresh profile: no user authenticated');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        logger.warn('No session token available for profile refresh');
        return;
      }

      const response = await fetch(`${baseUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user?.profilePicture) {
          setProfilePicture(data.user.profilePicture);
          // Update user metadata
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

  // Check for existing session on mount
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
      return;
    }

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const mappedUser: User = {
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
          };
          setUser(mappedUser);
          setAuthToken(session.access_token);
        }
      } catch (error) {
        logger.error('Session check error', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const mappedUser: User = {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
        };
        setUser(mappedUser);
        setAuthToken(session.access_token);
      } else {
        setUser(null);
        setAuthToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signin = async (email: string, password: string) => {
    if (useDemoAuth) {
      demoSignin(email, password);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.session?.user) {
      const mappedUser: User = {
        id: data.session.user.id,
        email: data.session.user.email,
        user_metadata: data.session.user.user_metadata,
      };
      setUser(mappedUser);
      setAuthToken(data.session.access_token);
      
      // Initialize user profile if needed (backend handles auto-init)
      try {
        const profileResponse = await fetch(`${baseUrl}/auth/profile`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.user?.profilePicture) {
            setProfilePicture(profileData.user.profilePicture);
          }
        }
      } catch (err) {
        logger.error('Profile initialization error during signin', err);
      }
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    if (useDemoAuth) {
      demoSignup(email, password, name);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      // Normalize error messages for better handling
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('already') || 
          errorMsg.includes('registered') || 
          errorMsg.includes('exists')) {
        throw new Error('User already registered');
      }
      
      if (errorMsg.includes('password')) {
        throw error; // Pass through password errors as-is
      }
      
      throw error;
    }

    // If user exists but no session, it might be waiting for email confirmation
    if (data.user && !data.session) {
      // Check if user was actually created (identities array is empty for existing users)
      if (data.user.identities && data.user.identities.length === 0) {
        throw new Error('User already registered');
      }
      
      // Email confirmation is required
      throw new Error('Please check your email to confirm your account before signing in.');
    }

    if (data.session?.user) {
      const mappedUser: User = {
        id: data.session.user.id,
        email: data.session.user.email,
        user_metadata: {
          name,
        },
      };
      setUser(mappedUser);
      setAuthToken(data.session.access_token);
      
      // Initialize user profile (backend handles auto-init)
      try {
        await fetch(`${baseUrl}/auth/profile`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
      } catch (err) {
        logger.error('Profile initialization error during signup', err);
      }
    }
  };

  const signout = async () => {
    if (useDemoAuth) {
      persistDemoSession(null);
      setUser(null);
      setAuthToken(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setAuthToken(null);
  };

  const getToken = async () => {
    if (useDemoAuth) {
      const session = readDemoSession();
      return session?.token ?? null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  // OAuth sign-in methods
  const signinWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/oauth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw error;
    }
  };

  const signinWithFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/oauth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const signinWithTwitter = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/oauth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  };

  // Load profile picture on mount
  useEffect(() => {
    if (user) {
      refreshProfile();
    }
  }, [user?.id]);

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
