import useSWR from 'swr';
import { Platform, PlatformFilter } from '../types';
import { logger } from '../utils/logger';
import { CacheKeys, CACHE_TTL, shouldFetch } from '../utils/swr-config';
import { trendingAPI } from '../utils/api';

export interface TrendingPost {
  id: string;
  platform: Platform;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: string;
  image?: string;
  engagement: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    retweets?: number;
  };
  trending_score: number;
  hashtags: string[];
  url: string;
  created_at: string;
  niche?: string;
}

export interface TrendingPostsResponse {
  posts: TrendingPost[];
  cached_at: string;
  next_refresh: string;
  platform: string;
}

export interface UseTrendingPostsOptions {
  /** Platform filter */
  platform?: PlatformFilter;
  /** Category filter (e.g., 'technology', 'programming') */
  category?: string;
  /** Number of posts to fetch (default: 10, max: 50) */
  count?: number;
  /** Disable automatic fetching */
  enabled?: boolean;
  /** Custom refresh interval (ms) - default: 15 minutes */
  refreshInterval?: number;
}

/**
 * Hook to fetch and manage trending posts with SWR caching
 *
 * Features:
 * - Multi-platform trending content (Reddit, Twitter, etc.)
 * - 15-minute client-side cache TTL
 * - 30-minute server-side cache
 * - Automatic background revalidation
 * - Comprehensive error handling with fallback to cached data
 * - Loading states and error recovery
 *
 * @param projectId - Current project ID (required for personalization)
 * @param options - Hook options (platform, category, count, etc.)
 * @returns Trending posts data, loading state, error, and refresh function
 *
 * @example
 * ```tsx
 * const { posts, isLoading, error, refresh } = useTrendingPosts(projectId, {
 *   platform: 'reddit',
 *   category: 'programming',
 *   count: 20
 * });
 * ```
 */
export function useTrendingPosts(
  projectId: string,
  options: UseTrendingPostsOptions = {}
) {
  const {
    platform = 'all',
    category,
    count = 10,
    enabled = true,
    refreshInterval = CACHE_TTL.FREQUENT, // 15 minutes
  } = options;

  // Validate count range
  const validatedCount = Math.min(Math.max(count, 1), 50);

  // Generate cache key with all parameters
  const cacheKey = projectId
    ? `${CacheKeys.getCacheKey('trending', projectId, platform, category, validatedCount.toString())}`
    : null;

  /**
   * Fetcher function for trending posts
   */
  const fetchTrendingPosts = async (): Promise<TrendingPostsResponse> => {
    logger.info('Fetching trending posts', {
      projectId,
      platform,
      category,
      count: validatedCount,
    });

    try {
      // Call API endpoint
      const response = await trendingAPI.get({
        platform: platform !== 'all' ? platform : undefined,
        category,
        count: validatedCount,
        projectId,
      });

      logger.info('Trending posts fetched successfully', {
        postCount: response.posts?.length || 0,
        cached_at: response.cached_at,
      });

      return response;
    } catch (error) {
      logger.error('Failed to fetch trending posts', error as Error, {
        projectId,
        platform,
        category,
      });
      throw error;
    }
  };

  // SWR hook with conditional fetching and caching
  const { data, error, isLoading, isValidating, mutate } = useSWR<TrendingPostsResponse>(
    // Only fetch if enabled and projectId exists
    enabled && shouldFetch(projectId) ? cacheKey : null,
    fetchTrendingPosts,
    {
      // Client-side cache for 15 minutes
      dedupingInterval: CACHE_TTL.FREQUENT,

      // Revalidate on window focus (user might want fresh trending content)
      revalidateOnFocus: true,

      // Revalidate on network reconnect
      revalidateOnReconnect: true,

      // Auto-refresh every 15 minutes (trending data changes frequently)
      refreshInterval,

      // Keep previous data while revalidating (prevent flash of empty state)
      keepPreviousData: true,

      // Retry on error (but not too aggressively)
      shouldRetryOnError: true,
      errorRetryCount: 2,
      errorRetryInterval: 10000, // 10 seconds between retries

      // Fallback to cached data on error
      fallbackData: undefined,

      // Optimistic updates enabled
      revalidateIfStale: true,
    }
  );

  /**
   * Manually refresh trending posts
   */
  const refresh = async () => {
    logger.info('Manually refreshing trending posts', { projectId, platform });
    await mutate();
  };

  /**
   * Filter posts by platform if "all" platforms selected
   */
  const filteredPosts =
    platform === 'all'
      ? data?.posts || []
      : (data?.posts || []).filter((post) => post.platform === platform);

  return {
    /** Trending posts (filtered by platform if needed) */
    posts: filteredPosts,

    /** All posts without platform filter */
    allPosts: data?.posts || [],

    /** Loading state (initial fetch) */
    isLoading,

    /** Revalidating state (background refresh) */
    isValidating,

    /** Error object if fetch failed */
    error: error as Error | undefined,

    /** Server cache metadata */
    cached_at: data?.cached_at,
    next_refresh: data?.next_refresh,

    /** Manually refresh function */
    refresh,

    /** Total count of trending posts */
    totalCount: filteredPosts.length,
  };
}
