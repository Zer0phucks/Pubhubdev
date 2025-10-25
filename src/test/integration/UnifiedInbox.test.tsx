import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../components/AuthContext';
import { ProjectProvider } from '../components/ProjectContext';
import { UnifiedInbox } from '../components/UnifiedInbox';

// Mock platform connections
vi.mock('../components/useConnectedPlatforms', () => ({
  useConnectedPlatforms: () => ['twitter', 'instagram', 'linkedin'],
}));

// Mock API calls
vi.mock('../utils/api', () => ({
  inboxAPI: {
    getMessages: vi.fn(),
    replyToMessage: vi.fn(),
    markAsRead: vi.fn(),
  },
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
    const mockMessages = [
      {
        id: '1',
        platform: 'twitter',
        content: 'Test tweet',
        author: '@testuser',
        timestamp: new Date().toISOString(),
        unread: true,
      },
      {
        id: '2',
        platform: 'instagram',
        content: 'Test comment',
        author: 'testuser',
        timestamp: new Date().toISOString(),
        unread: false,
      },
    ];

    const { inboxAPI } = await import('../utils/api');
    vi.mocked(inboxAPI.getMessages).mockResolvedValue({ messages: mockMessages });

    render(
      <TestWrapper>
        <UnifiedInbox />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test tweet')).toBeInTheDocument();
      expect(screen.getByText('Test comment')).toBeInTheDocument();
    });
  });

  it('filters messages by platform', async () => {
    const mockMessages = [
      {
        id: '1',
        platform: 'twitter',
        content: 'Twitter message',
        author: '@testuser',
        timestamp: new Date().toISOString(),
        unread: true,
      },
      {
        id: '2',
        platform: 'instagram',
        content: 'Instagram message',
        author: 'testuser',
        timestamp: new Date().toISOString(),
        unread: false,
      },
    ];

    const { inboxAPI } = await import('../utils/api');
    vi.mocked(inboxAPI.getMessages).mockResolvedValue({ messages: mockMessages });

    render(
      <TestWrapper>
        <UnifiedInbox />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Twitter message')).toBeInTheDocument();
      expect(screen.getByText('Instagram message')).toBeInTheDocument();
    });

    // Filter by Twitter
    const twitterFilter = screen.getByRole('button', { name: /twitter/i });
    await userEvent.click(twitterFilter);

    await waitFor(() => {
      expect(screen.getByText('Twitter message')).toBeInTheDocument();
      expect(screen.queryByText('Instagram message')).not.toBeInTheDocument();
    });
  });

  it('allows replying to messages', async () => {
    const mockMessages = [
      {
        id: '1',
        platform: 'twitter',
        content: 'Test tweet',
        author: '@testuser',
        timestamp: new Date().toISOString(),
        unread: true,
      },
    ];

    const { inboxAPI } = await import('../utils/api');
    vi.mocked(inboxAPI.getMessages).mockResolvedValue({ messages: mockMessages });
    vi.mocked(inboxAPI.replyToMessage).mockResolvedValue({ success: true });

    render(
      <TestWrapper>
        <UnifiedInbox />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test tweet')).toBeInTheDocument();
    });

    // Click reply button
    const replyButton = screen.getByRole('button', { name: /reply/i });
    await userEvent.click(replyButton);

    // Type reply
    const replyInput = screen.getByRole('textbox');
    await userEvent.type(replyInput, 'This is a reply');

    // Send reply
    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(inboxAPI.replyToMessage).toHaveBeenCalledWith('1', 'This is a reply');
    });
  });

  it('marks messages as read when viewed', async () => {
    const mockMessages = [
      {
        id: '1',
        platform: 'twitter',
        content: 'Test tweet',
        author: '@testuser',
        timestamp: new Date().toISOString(),
        unread: true,
      },
    ];

    const { inboxAPI } = await import('../utils/api');
    vi.mocked(inboxAPI.getMessages).mockResolvedValue({ messages: mockMessages });
    vi.mocked(inboxAPI.markAsRead).mockResolvedValue({ success: true });

    render(
      <TestWrapper>
        <UnifiedInbox />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test tweet')).toBeInTheDocument();
    });

    // Click on message to mark as read
    const message = screen.getByText('Test tweet');
    await userEvent.click(message);

    await waitFor(() => {
      expect(inboxAPI.markAsRead).toHaveBeenCalledWith('1');
    });
  });
});
