import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock the Supabase client module - must be before imports
vi.mock('@/utils/supabase/client', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
      profilePicture: null,
    },
    created_at: new Date().toISOString(),
    identities: [{ identity_id: 'test-identity-id' }],
  };

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
  };

  const client = {
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: 'https://mock-oauth-url.com', provider: 'google' }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => {
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
  };

  return {
    supabase: client,
    getSupabaseClient: () => client,
  };
});

// Mock the supabase info
vi.mock('@/utils/supabase/info', () => ({
  projectId: 'test-project-id',
}));

// Mock the API utils
vi.mock('@/utils/api', () => ({
  setAuthToken: vi.fn(),
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Now import the components after mocks are set up
import { AuthProvider, useAuth } from '@/components/AuthContext';
import * as supabaseModule from '@/utils/supabase/client';

// Export test data for use in tests
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    profilePicture: null,
  },
  created_at: new Date().toISOString(),
  identities: [{ identity_id: 'test-identity-id' }],
};

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
};

const mockAuthError = (message: string) => ({
  message,
  status: 400,
  name: 'AuthError',
});

// Test component to access auth context
function TestComponent() {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
    </div>
  );
}

// Test component with auth actions
function TestAuthActions() {
  const { signin, signup, signout, signinWithGoogle, signinWithFacebook, signinWithTwitter } = useAuth();

  return (
    <div>
      <button onClick={() => signin('test@example.com', 'password123')} data-testid="signin-btn">Sign In</button>
      <button onClick={() => signup('test@example.com', 'password123', 'Test User')} data-testid="signup-btn">Sign Up</button>
      <button onClick={() => signout()} data-testid="signout-btn">Sign Out</button>
      <button onClick={() => signinWithGoogle()} data-testid="google-btn">Google</button>
      <button onClick={() => signinWithFacebook()} data-testid="facebook-btn">Facebook</button>
      <button onClick={() => signinWithTwitter()} data-testid="twitter-btn">Twitter</button>
    </div>
  );
}

describe('AuthContext', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get the mocked supabase client
    mockSupabase = supabaseModule.supabase;
    // Reset default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.auth.onAuthStateChange.mockImplementation(() => {
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Initialization', () => {
    it('initializes with loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('initializes with no user when no session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
      });
    });

    it('initializes with user when session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
      });
    });

    it('sets up auth state change listener', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe('Sign In', () => {
    it('successfully signs in with email and password', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const signinBtn = getByTestId('signin-btn');
      signinBtn.click();

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('throws error on sign in failure', async () => {
      const error = mockAuthError('Invalid login credentials');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const signinBtn = getByTestId('signin-btn');

      await expect(async () => {
        signinBtn.click();
        await waitFor(() => {
          expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
        });
      }).rejects.toThrow();
    });
  });

  describe('Sign Up', () => {
    it('successfully signs up with email, password, and name', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const signupBtn = getByTestId('signup-btn');
      signupBtn.click();

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: {
              name: 'Test User',
            },
          },
        });
      });
    });

    it('throws error when user already exists', async () => {
      const error = mockAuthError('User already registered');
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const signupBtn = getByTestId('signup-btn');

      await expect(async () => {
        signupBtn.click();
        await waitFor(() => {
          expect(mockSupabase.auth.signUp).toHaveBeenCalled();
        });
      }).rejects.toThrow('User already registered');
    });

    it('throws error when email confirmation is required', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { ...mockUser, identities: [] },
          session: null
        },
        error: null
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const signupBtn = getByTestId('signup-btn');

      await expect(async () => {
        signupBtn.click();
        await waitFor(() => {
          expect(mockSupabase.auth.signUp).toHaveBeenCalled();
        });
      }).rejects.toThrow('Please check your email to confirm your account');
    });
  });

  describe('Sign Out', () => {
    it('successfully signs out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const signoutBtn = getByTestId('signout-btn');
      signoutBtn.click();

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('OAuth Sign In', () => {
    it('successfully initiates Google OAuth sign in', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://google.com/oauth', provider: 'google' },
        error: null
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const googleBtn = getByTestId('google-btn');
      googleBtn.click();

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/oauth/callback'),
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
      });
    });

    it('successfully initiates Facebook OAuth sign in', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://facebook.com/oauth', provider: 'facebook' },
        error: null
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const facebookBtn = getByTestId('facebook-btn');
      facebookBtn.click();

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'facebook',
          options: {
            redirectTo: expect.stringContaining('/oauth/callback'),
          },
        });
      });
    });

    it('successfully initiates Twitter OAuth sign in', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://twitter.com/oauth', provider: 'twitter' },
        error: null
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const twitterBtn = getByTestId('twitter-btn');
      twitterBtn.click();

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'twitter',
          options: {
            redirectTo: expect.stringContaining('/oauth/callback'),
          },
        });
      });
    });

    it('throws error on OAuth failure', async () => {
      const error = mockAuthError('OAuth provider error');
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: null, provider: null },
        error
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const googleBtn = getByTestId('google-btn');

      await expect(async () => {
        googleBtn.click();
        await waitFor(() => {
          expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalled();
        });
      }).rejects.toThrow();
    });
  });

  describe('Session Persistence', () => {
    it('persists user session on auth state change', async () => {
      let authCallback: any;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate auth state change
      if (authCallback) {
        authCallback('SIGNED_IN', mockSession);
      }

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
      });
    });

    it('clears user session on sign out auth state change', async () => {
      let authCallback: any;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate sign out
      if (authCallback) {
        authCallback('SIGNED_OUT', null);
      }

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles session check errors gracefully', async () => {
      const error = new Error('Session check failed');
      mockSupabase.auth.getSession.mockRejectedValue(error);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });
    });
  });

  describe('useAuth Hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });
});
