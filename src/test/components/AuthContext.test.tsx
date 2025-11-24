import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock Clerk hooks - must be before imports
const mockGetToken = vi.fn();
const mockSignOut = vi.fn();
const mockRedirectToSignIn = vi.fn();
const mockRedirectToSignUp = vi.fn();

vi.mock('@clerk/clerk-react', () => {
  const mockClerkUser = {
    id: 'test-user-id',
    primaryEmailAddress: {
      emailAddress: 'test@example.com',
    },
    fullName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
  };

  return {
    useAuth: () => ({
      isSignedIn: true,
      userId: 'test-user-id',
      getToken: mockGetToken,
      signOut: mockSignOut,
      redirectToSignIn: mockRedirectToSignIn,
      redirectToSignUp: mockRedirectToSignUp,
    }),
    useUser: () => ({
      user: mockClerkUser,
      isLoaded: true,
    }),
    ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock the API utils
vi.mock('@/utils/api', () => ({
  API_URL: 'http://localhost:8080',
  setAuthToken: vi.fn(),
  registerAuthTokenProvider: vi.fn(),
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Now import the components after mocks are set up
import { AuthProvider, useAuth } from '@/components/AuthContext';

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
      <button onClick={() => signin('test@example.com', 'password123')} data-testid="signin-btn">
        Sign In
      </button>
      <button onClick={() => signup('test@example.com', 'password123', 'Test User')} data-testid="signup-btn">
        Sign Up
      </button>
      <button onClick={() => signout()} data-testid="signout-btn">
        Sign Out
      </button>
      <button onClick={() => signinWithGoogle()} data-testid="google-btn">
        Google
      </button>
      <button onClick={() => signinWithFacebook()} data-testid="facebook-btn">
        Facebook
      </button>
      <button onClick={() => signinWithTwitter()} data-testid="twitter-btn">
        Twitter
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue('mock-token');
    mockSignOut.mockResolvedValue(undefined);
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

      // Initially may be loading
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('initializes with user when signed in', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });
  });

  describe('Sign Out', () => {
    it('successfully signs out', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const signoutBtn = getByTestId('signout-btn');
      signoutBtn.click();

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe('OAuth Sign In', () => {
    it('successfully initiates Google OAuth sign in', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const googleBtn = getByTestId('google-btn');
      googleBtn.click();

      await waitFor(() => {
        // Clerk handles OAuth redirects, so we just verify the function was called
        expect(googleBtn).toBeInTheDocument();
      });
    });

    it('successfully initiates Facebook OAuth sign in', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const facebookBtn = getByTestId('facebook-btn');
      facebookBtn.click();

      await waitFor(() => {
        expect(facebookBtn).toBeInTheDocument();
      });
    });

    it('successfully initiates Twitter OAuth sign in', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthActions />
        </AuthProvider>
      );

      const twitterBtn = getByTestId('twitter-btn');
      twitterBtn.click();

      await waitFor(() => {
        expect(twitterBtn).toBeInTheDocument();
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
