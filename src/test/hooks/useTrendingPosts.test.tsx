import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTrendingPosts } from '../../hooks/useTrendingPosts';
import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

// Mock the API
vi.mock('../../utils/api', () => ({
  trendingAPI: {
    get: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const { trendingAPI } = await import('../../utils/api');

describe('useTrendingPosts', () => {
  // Wrapper component for SWR provider
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch trending posts successfully', async () => {
    // Mock API response
    const mockResponse = {
      posts: [
        {
          id: 'reddit_123',
          platform: 'reddit' as const,
          author: {
            username: 'testuser',
            displayName: 'Test User',
            avatar: 'https://example.com/avatar.jpg',
          },
          content: 'Test trending post',
          engagement: {
            likes: 100,
            comments: 50,
          },
          trending_score: 85,
          hashtags: ['test', 'trending'],
          url: 'https://reddit.com/r/test/123',
          created_at: new Date().toISOString(),
          niche: 'programming',
        },
      ],
      cached_at: new Date().toISOString(),
      next_refresh: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      platform: 'reddit',
    };

    vi.mocked(trendingAPI.get).mockResolvedValue(mockResponse);

    // Render hook
    const { result } = renderHook(
      () => useTrendingPosts('test-project-id', { platform: 'reddit', count: 10 }),
      { wrapper }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.posts).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check data
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0].id).toBe('reddit_123');
    expect(result.current.posts[0].platform).toBe('reddit');
    expect(result.current.error).toBeUndefined();
    expect(result.current.totalCount).toBe(1);
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    const mockError = new Error('API request failed');
    vi.mocked(trendingAPI.get).mockRejectedValue(mockError);

    // Render hook
    const { result } = renderHook(
      () => useTrendingPosts('test-project-id', { platform: 'reddit', count: 10 }),
      { wrapper }
    );

    // Wait for error state
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    // Check error handling
    expect(result.current.error?.message).toBe('API request failed');
    expect(result.current.posts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should filter posts by platform', async () => {
    // Mock API response with multiple platforms
    const mockResponse = {
      posts: [
        {
          id: 'reddit_123',
          platform: 'reddit' as const,
          author: { username: 'user1', displayName: 'User 1' },
          content: 'Reddit post',
          engagement: { likes: 100 },
          trending_score: 85,
          hashtags: [],
          url: 'https://reddit.com/123',
          created_at: new Date().toISOString(),
        },
        {
          id: 'twitter_456',
          platform: 'twitter' as const,
          author: { username: 'user2', displayName: 'User 2' },
          content: 'Twitter post',
          engagement: { likes: 200 },
          trending_score: 90,
          hashtags: [],
          url: 'https://twitter.com/456',
          created_at: new Date().toISOString(),
        },
      ],
      cached_at: new Date().toISOString(),
      next_refresh: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      platform: 'all',
    };

    vi.mocked(trendingAPI.get).mockResolvedValue(mockResponse);

    // Render hook with platform filter
    const { result } = renderHook(
      () => useTrendingPosts('test-project-id', { platform: 'reddit', count: 10 }),
      { wrapper }
    );

    // Wait for data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check filtered results
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0].platform).toBe('reddit');
    expect(result.current.allPosts).toHaveLength(2); // All posts without filter
  });

  it('should not fetch when disabled', async () => {
    // Render hook with enabled=false
    const { result } = renderHook(
      () => useTrendingPosts('test-project-id', { enabled: false }),
      { wrapper }
    );

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    // API should not have been called
    expect(trendingAPI.get).not.toHaveBeenCalled();
    expect(result.current.posts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should validate and cap count parameter', async () => {
    const mockResponse = {
      posts: [],
      cached_at: new Date().toISOString(),
      next_refresh: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      platform: 'reddit',
    };

    vi.mocked(trendingAPI.get).mockResolvedValue(mockResponse);

    // Render hook with count > 50
    renderHook(() => useTrendingPosts('test-project-id', { count: 100 }), { wrapper });

    // Wait for API call
    await waitFor(() => {
      expect(trendingAPI.get).toHaveBeenCalled();
    });

    // Check that count was capped to 50
    const callArgs = vi.mocked(trendingAPI.get).mock.calls[0][0];
    expect(callArgs.count).toBe(50);
  });

  it('should provide refresh function', async () => {
    const mockResponse = {
      posts: [
        {
          id: 'reddit_123',
          platform: 'reddit' as const,
          author: { username: 'user1', displayName: 'User 1' },
          content: 'Test post',
          engagement: { likes: 100 },
          trending_score: 85,
          hashtags: [],
          url: 'https://reddit.com/123',
          created_at: new Date().toISOString(),
        },
      ],
      cached_at: new Date().toISOString(),
      next_refresh: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      platform: 'reddit',
    };

    vi.mocked(trendingAPI.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useTrendingPosts('test-project-id', { platform: 'reddit' }),
      { wrapper }
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear mock calls
    vi.clearAllMocks();

    // Call refresh
    await result.current.refresh();

    // Wait for refresh to complete
    await waitFor(() => {
      expect(trendingAPI.get).toHaveBeenCalledTimes(1);
    });
  });
});
