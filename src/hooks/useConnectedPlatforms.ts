import { useState, useEffect, useCallback, useMemo } from "react";
import { connectionsAPI } from "../utils/api";
import { useProject } from "../components/ProjectContext";
import { logger } from "../utils/logger";
import { Platform } from "../types";

interface PlatformConnection {
  platform: Platform;
  connected: boolean;
  username?: string;
  name?: string;
}

export function useConnectedPlatforms() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentProject } = useProject();

  const allPlatforms: Platform[] = [
    "twitter",
    "instagram", 
    "linkedin",
    "facebook",
    "youtube",
    "tiktok",
    "pinterest",
    "reddit",
    "blog"
  ];

  useEffect(() => {
    if (currentProject) {
      loadConnectedPlatforms();
    }
  }, [currentProject?.id]);

  // Refresh when returning from OAuth callback or WordPress connection
  useEffect(() => {
    if (!currentProject) return;

    const checkConnectionCompletion = async () => {
      const oauthJustCompleted = sessionStorage.getItem('oauth_just_completed');
      const wordpressJustConnected = sessionStorage.getItem('wordpress_just_connected');
      const platformDisconnected = sessionStorage.getItem('platform_disconnected');
      
      if (oauthJustCompleted === 'true') {
        logger.info('OAuth just completed, refreshing connected platforms...');
        sessionStorage.removeItem('oauth_just_completed');
        // Add a small delay to ensure backend has saved the data
        setTimeout(() => {
          loadConnectedPlatforms();
        }, 500);
      }
      
      if (wordpressJustConnected === 'true') {
        logger.info('WordPress just connected, refreshing connected platforms...');
        sessionStorage.removeItem('wordpress_just_connected');
        // Add a small delay to ensure backend has saved the data
        setTimeout(() => {
          loadConnectedPlatforms();
        }, 500);
      }
      
      if (platformDisconnected === 'true') {
        logger.info('Platform disconnected, refreshing connected platforms...');
        sessionStorage.removeItem('platform_disconnected');
        // Add a small delay to ensure backend has saved the data
        setTimeout(() => {
          loadConnectedPlatforms();
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
  }, [currentProject]);

  const loadConnectedPlatforms = useCallback(async () => {
    if (!currentProject) return;

    try {
      setLoading(true);
      logger.info('Loading connected platforms for project:', { projectId: currentProject.id });
      const { connections } = await connectionsAPI.getAll(currentProject.id);
      logger.info('Received connections from API:', { connectionsCount: connections?.length });

      // Filter to only connected platforms
      if (connections && connections.length > 0) {
        const connected = connections
          .filter((conn: PlatformConnection) => conn.connected === true)
          .map((conn: PlatformConnection) => conn.platform);
        logger.info('Connected platforms found:', { platforms: connected });
        setConnectedPlatforms(connected);
      } else {
        logger.info('No connected platforms found');
        setConnectedPlatforms([]);
      }
    } catch (error) {
      logger.error('Failed to load connected platforms', error);
      setConnectedPlatforms([]);
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  const hasUnconnectedPlatforms = useMemo(
    () => connectedPlatforms.length < allPlatforms.length,
    [connectedPlatforms.length]
  );

  const isPlatformConnected = useCallback(
    (platform: Platform) => connectedPlatforms.includes(platform),
    [connectedPlatforms]
  );

  const getConnectionStatus = useCallback(
    (platforms: Platform[]) => {
      const connected = platforms.filter(p => connectedPlatforms.includes(p));
      const notConnected = platforms.filter(p => !connectedPlatforms.includes(p));

      return {
        allConnected: notConnected.length === 0,
        connected,
        notConnected,
      };
    },
    [connectedPlatforms]
  );

  return {
    connectedPlatforms,
    allPlatforms,
    loading,
    hasUnconnectedPlatforms,
    isPlatformConnected,
    getConnectionStatus,
    refresh: loadConnectedPlatforms,
  };
}
