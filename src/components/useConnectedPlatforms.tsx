import { useState, useEffect } from "react";
import { connectionsAPI } from "../utils/api";
import { useProject } from "./ProjectContext";

export type Platform = "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

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
        console.log('OAuth just completed, refreshing connected platforms...');
        sessionStorage.removeItem('oauth_just_completed');
        // Add a small delay to ensure backend has saved the data
        setTimeout(() => {
          loadConnectedPlatforms();
        }, 500);
      }
      
      if (wordpressJustConnected === 'true') {
        console.log('WordPress just connected, refreshing connected platforms...');
        sessionStorage.removeItem('wordpress_just_connected');
        // Add a small delay to ensure backend has saved the data
        setTimeout(() => {
          loadConnectedPlatforms();
        }, 500);
      }
      
      if (platformDisconnected === 'true') {
        console.log('Platform disconnected, refreshing connected platforms...');
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

  const loadConnectedPlatforms = async () => {
    if (!currentProject) return;
    
    try {
      setLoading(true);
      console.log('Loading connected platforms for project:', currentProject.id);
      const { connections } = await connectionsAPI.getAll(currentProject.id);
      console.log('Received connections from API:', connections);
      
      // Filter to only connected platforms
      if (connections && connections.length > 0) {
        const connected = connections
          .filter((conn: PlatformConnection) => conn.connected === true)
          .map((conn: PlatformConnection) => conn.platform);
        console.log('Connected platforms found:', connected);
        setConnectedPlatforms(connected);
      } else {
        console.log('No connected platforms found');
        setConnectedPlatforms([]);
      }
    } catch (error) {
      console.error('Failed to load connected platforms:', error);
      setConnectedPlatforms([]);
    } finally {
      setLoading(false);
    }
  };

  const hasUnconnectedPlatforms = connectedPlatforms.length < allPlatforms.length;

  return {
    connectedPlatforms,
    loading,
    hasUnconnectedPlatforms,
    refresh: loadConnectedPlatforms
  };
}
