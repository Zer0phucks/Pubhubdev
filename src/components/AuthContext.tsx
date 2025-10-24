import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { setAuthToken } from '../utils/api';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  signout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
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
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/auth/profile`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
      } catch (err) {
        console.error('Profile initialization error:', err);
      }
    }
  };

  const signup = async (email: string, password: string, name: string) => {
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
      throw error;
    }

    // If user exists but no session, it might be waiting for email confirmation
    // or the user already exists
    if (data.user && !data.session) {
      // Check if email confirmation is required
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
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/auth/profile`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
      } catch (err) {
        console.error('Profile initialization error:', err);
      }
    }
  };

  const signout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthToken(null);
  };

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signin,
        signout,
        signup,
        getToken,
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
