import { connectionsAPI } from './api';
import { logger } from '../utils/logger';

export type Platform = "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

export interface PlatformConnection {
  platform: Platform;
  name: string;
  connected: boolean;
  username?: string;
  followers?: string;
  autoPost?: boolean;
  description: string;
}

/**
 * Get all connected platforms for the current user
 */
export async function getConnectedPlatforms(): Promise<Platform[]> {
  try {
    const { connections } = await connectionsAPI.getAll();
    return connections
      .filter((c: PlatformConnection) => c.connected)
      .map((c: PlatformConnection) => c.platform);
  } catch (error) {
    logger.error('Failed to get connected platforms:', error);
    return [];
  }
}

/**
 * Check if a specific platform is connected
 */
export async function isPlatformConnected(platform: Platform): Promise<boolean> {
  const connected = await getConnectedPlatforms();
  return connected.includes(platform);
}

/**
 * Check if multiple platforms are connected
 */
export async function arePlatformsConnected(platforms: Platform[]): Promise<{
  allConnected: boolean;
  connected: Platform[];
  notConnected: Platform[];
}> {
  const connectedPlatforms = await getConnectedPlatforms();
  
  const connected = platforms.filter(p => connectedPlatforms.includes(p));
  const notConnected = platforms.filter(p => !connectedPlatforms.includes(p));
  
  return {
    allConnected: notConnected.length === 0,
    connected,
    notConnected,
  };
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: Platform): string {
  const names: Record<Platform, string> = {
    twitter: 'Twitter',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    pinterest: 'Pinterest',
    reddit: 'Reddit',
    blog: 'Blog',
  };
  return names[platform] || platform;
}
