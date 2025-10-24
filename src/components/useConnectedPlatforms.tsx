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

  const loadConnectedPlatforms = async () => {
    if (!currentProject) return;
    
    try {
      setLoading(true);
      const { connections } = await connectionsAPI.getAll(currentProject.id);
      
      // Filter to only connected platforms
      if (connections && connections.length > 0) {
        const connected = connections
          .filter((conn: PlatformConnection) => conn.connected)
          .map((conn: PlatformConnection) => conn.platform);
        setConnectedPlatforms(connected);
      } else {
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
