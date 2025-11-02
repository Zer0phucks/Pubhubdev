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

  // Refresh when returning from OAuth callback
  useEffect(() => {
    if (!currentProject) return;

    const checkOAuthCompletion = async () => {
      const oauthJustCompleted = sessionStorage.getItem('oauth_just_completed');
      if (oauthJustCompleted === 'true') {
        console.log('OAuth just completed, refreshing connected platforms...');
        // Add a small delay to ensure backend has saved the data
        setTimeout(() => {
          loadConnectedPlatforms();
        }, 500);
      }
    };

    checkOAuthCompletion();

    // Also check on window focus in case user comes back from OAuth
    const handleFocus = () => {
      checkOAuthCompletion();
    };

    // Poll for OAuth completion (check every second for 10 seconds)
    const intervalId = setInterval(() => {
      checkOAuthCompletion();
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
