import { SWRConfiguration } from 'swr';
import * as Sentry from '@sentry/react';
import { logger } from './logger';

/**
 * Global SWR configuration for request caching
 *
 * Features:
 * - Automatic revalidation on focus/reconnect
 * - Request deduplication
 * - Error retry with exponential backoff
 * - Sentry integration for cache errors
 * - Performance optimizations
 */
export const swrConfig: SWRConfiguration = {
  // Revalidation settings
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateOnMount: true,

  // Request deduplication window (2 seconds)
  dedupingInterval: 2000,

  // Cache settings
  focusThrottleInterval: 5000, // Throttle revalidation on focus

  // Error handling
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000, // 5 seconds base interval

  // Loading delay to prevent flash of loading state
  loadingTimeout: 3000,

  // Error handler with Sentry integration
  onError: (error, key) => {
    // Log to console and Sentry
    logger.error('SWR cache error', error, { key });

    Sentry.captureException(error, {
      tags: {
        component: 'SWR',
        cache_key: String(key),
      },
      extra: {
        key,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Success handler for monitoring
  onSuccess: (data, key, config) => {
    // Log cache hits for monitoring (only in development)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('SWR cache hit', { key, dataSize: JSON.stringify(data).length });
    }
  },

  // Performance: Compare data to prevent unnecessary re-renders
  compare: (a, b) => {
    // Deep equality check for objects
    return JSON.stringify(a) === JSON.stringify(b);
  },

  // Keep previous data while revalidating (prevents flash of empty state)
  keepPreviousData: true,
};

/**
 * Cache TTL presets for different data types
 *
 * Use these constants for consistent cache behavior across the app
 */
export const CACHE_TTL = {
  /** User profile, project settings - 1 hour */
  STABLE: 60 * 60 * 1000,

  /** Platform connections, media library - 30 minutes */
  SEMI_STABLE: 30 * 60 * 1000,

  /** Analytics data - 15 minutes */
  FREQUENT: 15 * 60 * 1000,

  /** Inbox messages - 5 minutes */
  VERY_FREQUENT: 5 * 60 * 1000,

  /** Real-time data - 2 minutes */
  REALTIME: 2 * 60 * 1000,
} as const;

/**
 * Generate cache keys for consistent naming
 *
 * @example
 * getCacheKey('analytics', projectId, dateRange)
 * // Returns: 'analytics:project123:2024-01-01_2024-01-31'
 */
export function getCacheKey(...parts: (string | number | undefined | null)[]): string {
  return parts
    .filter((part) => part !== undefined && part !== null)
    .map((part) => String(part))
    .join(':');
}

/**
 * Cache key builders for common data types
 */
export const CacheKeys = {
  /** Projects cache key */
  projects: (userId: string) => getCacheKey('projects', userId),

  /** Single project cache key */
  project: (projectId: string) => getCacheKey('project', projectId),

  /** Analytics cache key with date range */
  analytics: (projectId: string, startDate?: string, endDate?: string) =>
    getCacheKey('analytics', projectId, startDate && endDate ? `${startDate}_${endDate}` : undefined),

  /** Platform connections cache key */
  connections: (projectId: string) => getCacheKey('connections', projectId),

  /** Inbox messages cache key with filter */
  inbox: (projectId: string, platform?: string, type?: string, isRead?: boolean) =>
    getCacheKey('inbox', projectId, platform, type, isRead?.toString()),

  /** Current user cache key */
  currentUser: () => getCacheKey('user', 'current'),

  /** Notifications cache key */
  notifications: (userId: string) => getCacheKey('notifications', userId),

  /** Media library cache key */
  media: (projectId: string) => getCacheKey('media', projectId),

  /** Trending posts cache key with platform and category */
  trending: (projectId: string, platform?: string, category?: string, count?: string) =>
    getCacheKey('trending', projectId, platform, category, count),

  /** Export getCacheKey for custom cache keys */
  getCacheKey,
} as const;

/**
 * Conditional fetching helper
 *
 * Use with SWR to prevent fetching when conditions aren't met
 *
 * @example
 * useSWR(shouldFetch(projectId) ? key : null, fetcher)
 */
export function shouldFetch<T>(...conditions: T[]): boolean {
  return conditions.every((condition) => {
    if (typeof condition === 'string') {
      return condition.length > 0;
    }
    return Boolean(condition);
  });
}
