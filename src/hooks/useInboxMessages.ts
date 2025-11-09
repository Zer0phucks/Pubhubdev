import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, InboxMessage } from '../types';
import { logger } from '../utils/logger';

export interface InboxFilter {
  platform?: Platform | 'all';
  type?: 'comment' | 'message' | 'mention' | 'all';
  isRead?: boolean;
  searchQuery?: string;
}

export interface InboxMessagesData {
  messages: InboxMessage[];
  filteredMessages: InboxMessage[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and filter inbox messages
 *
 * @param projectId - Current project ID
 * @param initialFilter - Initial filter criteria
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
  initialFilter: InboxFilter = {}
) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [filter, setFilter] = useState<InboxFilter>(initialFilter);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!projectId) {
      logger.warn('No project ID provided for inbox messages');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
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

      setMessages(mockMessages);
    } catch (err: unknown) {
      logger.error('Failed to fetch inbox messages', err, { projectId });
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      // Platform filter
      if (filter.platform && filter.platform !== 'all' && message.platform !== filter.platform) {
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
    () => messages.filter((m) => !m.isRead).length,
    [messages]
  );

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      // TODO: API call to mark as read
      // await messagesAPI.markAsRead(messageId);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (err: unknown) {
      logger.error('Failed to mark message as read', err, { messageId });
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // TODO: API call to mark all as read
      // await messagesAPI.markAllAsRead(projectId);

      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, isRead: true }))
      );
    } catch (err: unknown) {
      logger.error('Failed to mark all messages as read', err);
      throw err;
    }
  }, [projectId]);

  const reply = useCallback(async (messageId: string, content: string) => {
    try {
      // TODO: API call to send reply
      // await messagesAPI.reply(messageId, content);

      logger.info('Reply sent successfully', { messageId });
    } catch (err: unknown) {
      logger.error('Failed to send reply', err, { messageId });
      throw err;
    }
  }, []);

  const archive = useCallback(async (messageId: string) => {
    try {
      // TODO: API call to archive message
      // await messagesAPI.archive(messageId);

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err: unknown) {
      logger.error('Failed to archive message', err, { messageId });
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    data: {
      messages,
      filteredMessages,
      unreadCount,
      isLoading,
      error,
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
