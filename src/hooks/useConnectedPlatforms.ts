import { useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { connectionsAPI } from '../utils/api';
import { useProject } from '../components/ProjectContext';
import { logger } from '../utils/logger';
import { Platform } from '../types';
import { CacheKeys, CACHE_TTL, shouldFetch } from '../utils/swr-config';

interface PlatformConnection {
  platform: Platform;
  connected: boolean;
  username?: string;
  name?: string;
}

export interface UseConnectedPlatformsOptions {
  /** Disable automatic fetching */
  enabled?: boolean;
  /** Custom refresh interval (ms) - default: 30 minutes */
  refreshInterval?: number;
}

/**
 * Hook to fetch and manage platform connections with SWR caching
 *
 * Features:
 * - Automatic request deduplication
 * - 30-minute cache TTL (connections are semi-stable)
 * - Manual revalidation on OAuth callback
 * - Automatic refresh on window focus after OAuth
 *
 * @param options - Hook options
 * @returns Connected platforms data with loading state and actions
 *
 * @example
 * const { connectedPlatforms, isPlatformConnected, refresh } = useConnectedPlatforms();
 */
export function useConnectedPlatforms(options: UseConnectedPlatformsOptions = {}) {
  const { enabled = true, refreshInterval } = options;
  const { currentProject } = useProject();

  const allPlatforms: Platform[] = [
    'twitter',
    'instagram',
    'linkedin',
    'facebook',
    'youtube',
    'tiktok',
    'pinterest',
    'reddit',
    'blog',
  ];

  // Generate cache key
  const cacheKey = currentProject?.id
    ? CacheKeys.connections(currentProject.id)
    : null;

  // Fetcher function
  const fetchConnections = async (): Promise<Platform[]> => {
    if (!currentProject?.id) {
      return [];
    }

    logger.info('Loading connected platforms for project:', {
      projectId: currentProject.id,
    });

    const { connections } = await connectionsAPI.getAll(currentProject.id);
    logger.info('Received connections from API:', {
      connectionsCount: connections?.length,
    });

    // Filter to only connected platforms
    if (connections && connections.length > 0) {
      const connected = connections
        .filter((conn: PlatformConnection) => conn.connected === true)
        .map((conn: PlatformConnection) => conn.platform);
      logger.info('Connected platforms found:', { platforms: connected });
      return connected;
    }

    logger.info('No connected platforms found');
    return [];
  };

  // SWR hook with conditional fetching
  const { data: connectedPlatforms, error, isLoading, isValidating, mutate } = useSWR<Platform[]>(
    // Only fetch if enabled and currentProject exists
    enabled && shouldFetch(currentProject?.id) ? cacheKey : null,
    fetchConnections,
    {
      // Cache for 30 minutes
      dedupingInterval: CACHE_TTL.SEMI_STABLE,
      // Revalidate on window focus (user might come back from OAuth)
      revalidateOnFocus: true,
      // Revalidate on network reconnect
      revalidateOnReconnect: true,
      // Optional refresh interval
      refreshInterval,
      // Keep previous data while revalidating
      keepPreviousData: true,
      // Retry on error
      shouldRetryOnError: true,
      errorRetryCount: 2,
    }
  );

  // Refresh when returning from OAuth callback or WordPress connection
  useEffect(() => {
    if (!currentProject) return;

    const checkConnectionCompletion = async () => {
      const oauthJustCompleted = sessionStorage.getItem('oauth_just_completed');
      const wordpressJustConnected = sessionStorage.getItem(
        'wordpress_just_connected'
      );
      const platformDisconnected = sessionStorage.getItem('platform_disconnected');

      if (oauthJustCompleted === 'true') {
        logger.info('OAuth just completed, refreshing connected platforms...');
        sessionStorage.removeItem('oauth_just_completed');
        // Add a small delay to ensure backend has saved the data
        setTimeout(() => {
          mutate();
        }, 500);
      }

      if (wordpressJustConnected === 'true') {
        logger.info('WordPress just connected, refreshing connected platforms...');
        sessionStorage.removeItem('wordpress_just_connected');
        setTimeout(() => {
          mutate();
        }, 500);
      }

      if (platformDisconnected === 'true') {
        logger.info('Platform disconnected, refreshing connected platforms...');
        sessionStorage.removeItem('platform_disconnected');
        setTimeout(() => {
          mutate();
        }, 500);
      }
    };

    checkConnectionCompletion();

    // Also check on window focus in case user comes back from OAuth/WordPress
    const handleFocus = () => {
      checkConnectionCompletion();
    };

    // Poll for connection completion (check every second for 10 seconds)
    const intervalId = setInterval(() => {
      checkConnectionCompletion();
    }, 1000);

    window.addEventListener('focus', handleFocus);

    // Clean up after 10 seconds to stop polling
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [currentProject, mutate]);

  const hasUnconnectedPlatforms = useMemo(
    () => (connectedPlatforms?.length || 0) < allPlatforms.length,
    [connectedPlatforms?.length]
  );

  const isPlatformConnected = (platform: Platform) =>
    connectedPlatforms?.includes(platform) || false;

  const getConnectionStatus = (platforms: Platform[]) => {
    const connected = platforms.filter((p) =>
      connectedPlatforms?.includes(p)
    );
    const notConnected = platforms.filter(
      (p) => !connectedPlatforms?.includes(p)
    );

    return {
      allConnected: notConnected.length === 0,
      connected,
      notConnected,
    };
  };

  /**
   * Manually refresh connections (e.g., after OAuth callback)
   */
  const refresh = () => {
    logger.info('Manually refreshing connected platforms');
    mutate();
  };

  /**
   * Optimistically update after connecting a platform
   */
  const addPlatformOptimistic = (platform: Platform) => {
    mutate(
      (current) => {
        const updated = [...(current || []), platform];
        logger.info('Optimistically added platform', { platform, updated });
        return updated;
      },
      {
        revalidate: true, // Revalidate after optimistic update
      }
    );
  };

  /**
   * Optimistically update after disconnecting a platform
   */
  const removePlatformOptimistic = (platform: Platform) => {
    mutate(
      (current) => {
        const updated = (current || []).filter((p) => p !== platform);
        logger.info('Optimistically removed platform', { platform, updated });
        return updated;
      },
      {
        revalidate: true, // Revalidate after optimistic update
      }
    );
  };

  return {
    connectedPlatforms: connectedPlatforms || [],
    allPlatforms,
    loading: isLoading,
    isValidating,
    error: error as Error | undefined,
    hasUnconnectedPlatforms,
    isPlatformConnected,
    getConnectionStatus,
    refresh,
    addPlatformOptimistic,
    removePlatformOptimistic,
  };
}
