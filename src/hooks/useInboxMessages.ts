import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Platform, InboxMessage } from '../types';
import { logger } from '../utils/logger';
import { CacheKeys, CACHE_TTL, shouldFetch } from '../utils/swr-config';

export interface InboxFilter {
  platform?: Platform | 'all';
  type?: 'comment' | 'message' | 'mention' | 'all';
  isRead?: boolean;
  searchQuery?: string;
}

export interface UseInboxMessagesOptions {
  /** Disable automatic fetching */
  enabled?: boolean;
  /** Custom refresh interval (ms) - default: 5 minutes */
  refreshInterval?: number;
}

/**
 * Hook to fetch and filter inbox messages with SWR caching
 *
 * Features:
 * - Automatic request deduplication
 * - 5-minute cache TTL (messages update frequently)
 * - Client-side filtering (no server requests on filter change)
 * - Optimistic updates for mark as read/reply/archive
 *
 * @param projectId - Current project ID
 * @param initialFilter - Initial filter criteria
 * @param options - Hook options
 * @returns Inbox messages data, filter controls, and actions
 *
 * @example
 * const { data, filter, setFilter, markAsRead, reply } = useInboxMessages(projectId, {
 *   platform: 'twitter',
 *   isRead: false
 * });
 */
export function useInboxMessages(
  projectId: string,
  initialFilter: InboxFilter = {},
  options: UseInboxMessagesOptions = {}
) {
  const { enabled = true, refreshInterval = CACHE_TTL.VERY_FREQUENT } = options;
  const [filter, setFilter] = useState<InboxFilter>(initialFilter);

  // Generate cache key (filter is applied client-side, so not in cache key)
  const cacheKey = projectId ? CacheKeys.inbox(projectId) : null;

  // Fetcher function
  const fetchMessages = async (): Promise<InboxMessage[]> => {
    if (!projectId) {
      logger.warn('No project ID provided for inbox messages');
      return [];
    }

    logger.info('Fetching inbox messages', { projectId });

    // TODO: Replace with actual API call
    // const response = await messagesAPI.getAll(projectId);

    // Mock data for now
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockMessages: InboxMessage[] = [
      {
        id: '1',
        platform: 'twitter',
        type: 'comment',
        from: 'Sarah Chen',
        content: 'Love this! Can you share more tips on content creation?',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isRead: false,
      },
      {
        id: '2',
        platform: 'instagram',
        type: 'comment',
        from: 'Mike Johnson',
        content: 'This is exactly what I needed to see today. Thank you!',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        isRead: false,
      },
      {
        id: '3',
        platform: 'linkedin',
        type: 'message',
        from: 'Emily Rodriguez',
        content: 'Great insights! Would love to collaborate on a project.',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        isRead: true,
      },
      {
        id: '4',
        platform: 'twitter',
        type: 'mention',
        from: 'Alex Kim',
        content: 'Mentioned you in a post about content marketing strategies!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: true,
      },
    ];

    return mockMessages;
  };

  // SWR hook with conditional fetching
  const {
    data: messages,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<InboxMessage[]>(
    // Only fetch if enabled and projectId exists
    enabled && shouldFetch(projectId) ? cacheKey : null,
    fetchMessages,
    {
      // Cache for 5 minutes
      dedupingInterval: CACHE_TTL.VERY_FREQUENT,
      // Revalidate on window focus (new messages might have arrived)
      revalidateOnFocus: true,
      // Revalidate on network reconnect
      revalidateOnReconnect: true,
      // Auto-refresh every 5 minutes
      refreshInterval,
      // Keep previous data while revalidating
      keepPreviousData: true,
      // Retry on error
      shouldRetryOnError: true,
      errorRetryCount: 2,
    }
  );

  // Client-side filtering (no server request on filter change)
  const filteredMessages = useMemo(() => {
    if (!messages) return [];

    return messages.filter((message) => {
      // Platform filter
      if (
        filter.platform &&
        filter.platform !== 'all' &&
        message.platform !== filter.platform
      ) {
        return false;
      }

      // Type filter
      if (filter.type && filter.type !== 'all' && message.type !== filter.type) {
        return false;
      }

      // Read status filter
      if (filter.isRead !== undefined && message.isRead !== filter.isRead) {
        return false;
      }

      // Search query filter
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        return (
          message.from.toLowerCase().includes(query) ||
          message.content.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [messages, filter]);

  const unreadCount = useMemo(
    () => (messages || []).filter((m) => !m.isRead).length,
    [messages]
  );

  /**
   * Mark a message as read with optimistic update
   */
  const markAsRead = async (messageId: string) => {
    try {
      // Optimistic update
      mutate(
        (currentMessages) => {
          return (currentMessages || []).map((msg) =>
            msg.id === messageId ? { ...msg, isRead: true } : msg
          );
        },
        {
          revalidate: false,
        }
      );

      // TODO: API call to mark as read
      // await messagesAPI.markAsRead(messageId);

      logger.info('Message marked as read', { messageId });
    } catch (err: unknown) {
      // Rollback on error
      mutate();
      logger.error('Failed to mark message as read', err, { messageId });
      throw err;
    }
  };

  /**
   * Mark all messages as read with optimistic update
   */
  const markAllAsRead = async () => {
    try {
      // Optimistic update
      mutate(
        (currentMessages) => {
          return (currentMessages || []).map((msg) => ({ ...msg, isRead: true }));
        },
        {
          revalidate: false,
        }
      );

      // TODO: API call to mark all as read
      // await messagesAPI.markAllAsRead(projectId);

      logger.info('All messages marked as read');
    } catch (err: unknown) {
      // Rollback on error
      mutate();
      logger.error('Failed to mark all messages as read', err);
      throw err;
    }
  };

  /**
   * Reply to a message
   */
  const reply = async (messageId: string, content: string) => {
    try {
      // TODO: API call to send reply
      // await messagesAPI.reply(messageId, content);

      logger.info('Reply sent successfully', { messageId });

      // Refresh messages after reply
      mutate();
    } catch (err: unknown) {
      logger.error('Failed to send reply', err, { messageId });
      throw err;
    }
  };

  /**
   * Archive a message with optimistic update
   */
  const archive = async (messageId: string) => {
    try {
      // Optimistic update: Remove immediately
      mutate(
        (currentMessages) => {
          return (currentMessages || []).filter((msg) => msg.id !== messageId);
        },
        {
          revalidate: false,
        }
      );

      // TODO: API call to archive message
      // await messagesAPI.archive(messageId);

      logger.info('Message archived', { messageId });
    } catch (err: unknown) {
      // Rollback on error
      mutate();
      logger.error('Failed to archive message', err, { messageId });
      throw err;
    }
  };

  /**
   * Manually refresh messages
   */
  const refresh = () => {
    logger.info('Manually refreshing inbox messages');
    mutate();
  };

  return {
    data: {
      messages: messages || [],
      filteredMessages,
      unreadCount,
      isLoading,
      isValidating,
      error: error as Error | undefined,
    },
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    reply,
    archive,
    refresh,
  };
}
