import useSWR from 'swr';
import { Platform } from '../types';
import { logger } from '../utils/logger';
import { CacheKeys, CACHE_TTL, shouldFetch } from '../utils/swr-config';

export interface AnalyticsMetrics {
  totalReach: number;
  engagement: number;
  newMessages: number;
  scheduledPosts: number;
  reachChange: string;
  engagementChange: string;
  messagesChange: string;
  postsChange: string;
}

export interface PlatformMetrics {
  platform: Platform;
  followers: number;
  posts: number;
  engagement: number;
}

export interface AnalyticsDateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  platformMetrics: PlatformMetrics[];
}

export interface UseAnalyticsOptions {
  /** Disable automatic fetching */
  enabled?: boolean;
  /** Custom refresh interval (ms) - default: 15 minutes */
  refreshInterval?: number;
}

/**
 * Hook to fetch and manage analytics data with SWR caching
 *
 * Features:
 * - Automatic request deduplication
 * - 15-minute cache TTL (analytics update frequently)
 * - Conditional fetching (only when route is active)
 * - Background revalidation
 *
 * @param projectId - Current project ID
 * @param dateRange - Optional date range for analytics
 * @param options - Hook options
 * @returns Analytics data, loading state, and refresh function
 *
 * @example
 * const { data, isLoading, refresh } = useAnalytics(projectId, {
 *   start: new Date('2024-01-01'),
 *   end: new Date('2024-01-31')
 * });
 */
export function useAnalytics(
  projectId: string,
  dateRange?: AnalyticsDateRange,
  options: UseAnalyticsOptions = {}
) {
  const { enabled = true, refreshInterval = CACHE_TTL.FREQUENT } = options;

  // Format date range for cache key
  const dateRangeKey = dateRange
    ? `${dateRange.start.toISOString().split('T')[0]}_${dateRange.end.toISOString().split('T')[0]}`
    : undefined;

  // Generate cache key
  const cacheKey = projectId
    ? CacheKeys.analytics(
        projectId,
        dateRange?.start.toISOString().split('T')[0],
        dateRange?.end.toISOString().split('T')[0]
      )
    : null;

  // Fetcher function
  const fetchAnalytics = async (): Promise<AnalyticsData> => {
    logger.info('Fetching analytics', { projectId, dateRange: dateRangeKey });

    // TODO: Replace with actual API call to fetch analytics
    // const response = await analyticsAPI.get(projectId, dateRange);

    // Mock data for now
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockMetrics: AnalyticsMetrics = {
      totalReach: 45678,
      engagement: 3456,
      newMessages: 128,
      scheduledPosts: 24,
      reachChange: '+12.5%',
      engagementChange: '+8.3%',
      messagesChange: '+5.2%',
      postsChange: '+15.0%',
    };

    const mockPlatformMetrics: PlatformMetrics[] = [
      { platform: 'twitter', followers: 15420, posts: 87, engagement: 1234 },
      { platform: 'instagram', followers: 23456, posts: 45, engagement: 2345 },
      { platform: 'linkedin', followers: 8765, posts: 23, engagement: 567 },
    ];

    return {
      metrics: mockMetrics,
      platformMetrics: mockPlatformMetrics,
    };
  };

  // SWR hook with conditional fetching
  const { data, error, isLoading, isValidating, mutate } = useSWR<AnalyticsData>(
    // Only fetch if enabled and projectId exists
    enabled && shouldFetch(projectId) ? cacheKey : null,
    fetchAnalytics,
    {
      // Cache for 15 minutes
      dedupingInterval: CACHE_TTL.FREQUENT,
      // Revalidate on window focus (user might come back after data changed)
      revalidateOnFocus: true,
      // Revalidate on network reconnect
      revalidateOnReconnect: true,
      // Auto-refresh every 15 minutes
      refreshInterval,
      // Keep previous data while revalidating (prevent flash of empty state)
      keepPreviousData: true,
      // Retry on error (analytics are important)
      shouldRetryOnError: true,
      errorRetryCount: 3,
    }
  );

  /**
   * Manually refresh analytics data
   */
  const refresh = () => {
    logger.info('Manually refreshing analytics', { projectId });
    mutate();
  };

  return {
    data: data?.metrics,
    platformMetrics: data?.platformMetrics || [],
    isLoading,
    isValidating,
    error: error as Error | undefined,
    refresh,
  };
}
