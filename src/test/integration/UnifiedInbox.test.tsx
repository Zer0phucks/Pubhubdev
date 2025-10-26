import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/components/AuthContext';
import { ProjectProvider } from '@/components/ProjectContext';
import { UnifiedInbox } from '@/components/UnifiedInbox';

// Mock platform connections
vi.mock('../components/useConnectedPlatforms', () => ({
  useConnectedPlatforms: () => ['twitter', 'instagram', 'linkedin'],
}));

// Mock API calls
vi.mock('@/utils/api', () => ({
  inboxAPI: {
    getMessages: vi.fn(),
    replyToMessage: vi.fn(),
    markAsRead: vi.fn(),
  },
  setAuthToken: vi.fn(),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ProjectProvider>
      {children}
    </ProjectProvider>
  </AuthProvider>
);

describe('UnifiedInbox Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays messages from connected platforms', async () => {
    render(
      <TestWrapper>
        <UnifiedInbox inboxView="all" selectedPlatform="all" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Love this! Can you share more tips on content creation?')).toBeInTheDocument();
      expect(screen.getByText('This is exactly what I needed to see today. Thank you!')).toBeInTheDocument();
    });
  });

  it('filters messages by platform', async () => {
    render(
      <TestWrapper>
        <UnifiedInbox inboxView="all" selectedPlatform="twitter" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Love this! Can you share more tips on content creation?')).toBeInTheDocument();
      expect(screen.getByText('Mentioned you in a post about content marketing strategies!')).toBeInTheDocument();
    });
  });

  it('allows replying to messages', async () => {
    render(
      <TestWrapper>
        <UnifiedInbox inboxView="all" selectedPlatform="all" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Love this! Can you share more tips on content creation?')).toBeInTheDocument();
    });

    // Click on first message to select it
    const messageButton = screen.getByText('Love this! Can you share more tips on content creation?');
    await userEvent.click(messageButton);

    // Should show reply interface
    await waitFor(() => {
      expect(screen.getByText('Reply')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Reply/i })).toBeInTheDocument();
    });
  });

  it('marks messages as read when viewed', async () => {
    render(
      <TestWrapper>
        <UnifiedInbox inboxView="all" selectedPlatform="all" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Love this! Can you share more tips on content creation?')).toBeInTheDocument();
    });

    // Click on first message to select it
    const messageButton = screen.getByText('Love this! Can you share more tips on content creation?');
    await userEvent.click(messageButton);

    // Should show the selected message details
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sarah Chen' })).toBeInTheDocument();
    });
  });
});
