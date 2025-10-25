import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { setAuthToken } from '../utils/api';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e`;

  // Fetch user profile with profile picture
  const refreshProfile = async () => {
    if (!user) {
      console.warn('Cannot refresh profile: no user authenticated');
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('No session token available for profile refresh');
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
        console.error('Failed to refresh profile:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

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

  // OAuth sign-in methods
  const signinWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/oauth/callback`,
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
