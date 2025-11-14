import { useState, useCallback } from 'react';
import { Platform, toAppError } from '../types';
import { oauthAPI, connectionsAPI, setAuthToken } from '../utils/api';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

export interface PlatformConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  username?: string;
  accountId?: string;
  metadata?: Record<string, unknown>;
}

export interface PlatformConnectionResult {
  state: PlatformConnectionState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage platform connection state and OAuth flow
 *
 * @param platform - The platform to manage connection for
 * @param projectId - The current project ID
 * @returns Platform connection state and control functions
 *
 * @example
 * const { state, connect, disconnect, refresh } = usePlatformConnection('twitter', projectId);
 * if (!state.isConnected) {
 *   await connect(); // Initiates OAuth flow
 * }
 */
export function usePlatformConnection(
  platform: Platform,
  projectId: string
): PlatformConnectionResult {
  const [state, setState] = useState<PlatformConnectionState>({
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!projectId) {
      logger.warn('No project ID provided for platform connection refresh');
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { connections } = await connectionsAPI.getAll(projectId);
      const connection = connections?.find((c: ConnectionPayload) => c.platform === platform);

      setState({
        isConnected: connection?.connected || false,
        isLoading: false,
        error: null,
        username: connection?.username,
        accountId: connection?.accountId,
        metadata: connection?.metadata,
      });
    } catch (error: unknown) {
      logger.error('Failed to refresh platform connection', error, { platform });
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [platform, projectId]);

  const connect = useCallback(async () => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      toast.info(`Connecting to ${platform}...`, {
        description: 'You will be redirected to authorize PubHub',
      });

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('You must be signed in to connect platforms');
      }

      // Update auth token for API calls
      setAuthToken(session.access_token);

      // Get authorization URL from backend
      const data = await oauthAPI.authorize(platform, projectId);

      // Store state for callback verification
      sessionStorage.setItem('oauth_state', data.state);
      sessionStorage.setItem('oauth_platform', platform);
      sessionStorage.setItem('oauth_project_id', projectId);

      // Redirect to OAuth provider
      window.location.href = data.authUrl;
    } catch (error: unknown) {
      const err = toAppError(error);
      logger.error('OAuth flow error', error, { platform });
      toast.error(err.message || 'Failed to connect platform');

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [platform, projectId]);

  const disconnect = useCallback(async () => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('You must be signed in to disconnect platforms');
      }

      // Update auth token for API calls
      setAuthToken(session.access_token);

      // Call backend to disconnect OAuth
      await oauthAPI.disconnect(platform, projectId);

      setState({
        isConnected: false,
        isLoading: false,
        error: null,
        username: undefined,
        accountId: undefined,
        metadata: undefined,
      });

      toast.success(`${platform} disconnected successfully`);

      // Set flag to trigger refresh in other components
      sessionStorage.setItem('platform_disconnected', 'true');
    } catch (error: unknown) {
      const err = toAppError(error);
      logger.error('Disconnect error', error, { platform });
      toast.error(err.message || 'Failed to disconnect platform');

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [platform, projectId]);

  return {
    state,
    connect,
    disconnect,
    refresh,
  };
}
