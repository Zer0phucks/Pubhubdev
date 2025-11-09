import { useState, useEffect, useCallback } from 'react';
import { Platform } from '../types';
import { logger } from '../utils/logger';

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
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and manage analytics data
 *
 * @param projectId - Current project ID
 * @param dateRange - Optional date range for analytics
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
  dateRange?: AnalyticsDateRange
) {
  const [data, setData] = useState<AnalyticsData>({
    metrics: {
      totalReach: 0,
      engagement: 0,
      newMessages: 0,
      scheduledPosts: 0,
      reachChange: '+0%',
      engagementChange: '+0%',
      messagesChange: '+0%',
      postsChange: '+0%',
    },
    platformMetrics: [],
    isLoading: true,
    error: null,
  });

  const fetchAnalytics = useCallback(async () => {
    if (!projectId) {
      logger.warn('No project ID provided for analytics');
      return;
    }

    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
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

      setData({
        metrics: mockMetrics,
        platformMetrics: mockPlatformMetrics,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      logger.error('Failed to fetch analytics', error, { projectId });
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [projectId, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refresh = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data: data.metrics,
    platformMetrics: data.platformMetrics,
    isLoading: data.isLoading,
    error: data.error,
    refresh,
  };
}
