import { connectionsAPI } from './api';
import { logger } from '../utils/logger';
import { Platform, PLATFORM_CONSTRAINTS } from '../types';
import { PLATFORM_CONFIGS } from '../constants/platforms';

export interface PlatformConnection {
  platform: Platform;
  name: string;
  connected: boolean;
  username?: string;
  followers?: string;
  autoPost?: boolean;
  description: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

/**
 * Get all connected platforms for the current user
 */
export async function getConnectedPlatforms(projectId?: string): Promise<Platform[]> {
  try {
    const { connections } = await connectionsAPI.getAll(projectId);
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
export async function isPlatformConnected(platform: Platform, projectId?: string): Promise<boolean> {
  const connected = await getConnectedPlatforms(projectId);
  return connected.includes(platform);
}

/**
 * Check if multiple platforms are connected
 */
export async function arePlatformsConnected(platforms: Platform[], projectId?: string): Promise<{
  allConnected: boolean;
  connected: Platform[];
  notConnected: Platform[];
}> {
  const connectedPlatforms = await getConnectedPlatforms(projectId);

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
  return PLATFORM_CONFIGS[platform]?.displayName || platform;
}

/**
 * Get platform color
 */
export function getPlatformColor(platform: Platform): string {
  return PLATFORM_CONFIGS[platform]?.color || '#6B7280';
}

/**
 * Get platform gradient
 */
export function getPlatformGradient(platform: Platform): string {
  return PLATFORM_CONFIGS[platform]?.gradient || 'from-gray-500 to-gray-600';
}

/**
 * Validate content for a specific platform
 */
export function validatePlatformContent(
  platform: Platform,
  content: string,
  imageCount: number = 0,
  videoCount: number = 0
): ValidationResult {
  const constraints = PLATFORM_CONSTRAINTS[platform];
  const issues: string[] = [];

  if (!constraints) {
    issues.push('Unknown platform');
    return { isValid: false, issues };
  }

  // Character limit
  if (content.length > constraints.maxLength) {
    issues.push(
      `Content exceeds ${platform} character limit (${content.length}/${constraints.maxLength})`
    );
  }

  // Image limit
  if (imageCount > constraints.maxImages) {
    issues.push(
      `Too many images for ${platform} (${imageCount}/${constraints.maxImages})`
    );
  }

  // Video limit
  if (videoCount > constraints.maxVideos) {
    issues.push(
      `Too many videos for ${platform} (${videoCount}/${constraints.maxVideos})`
    );
  }

  // Content required
  if (content.length === 0 && imageCount === 0 && videoCount === 0) {
    issues.push('Content, image, or video is required');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Format platform-specific error messages
 */
export function formatPlatformError(platform: Platform, error: Error): string {
  const platformName = getPlatformName(platform);

  // Check for common error patterns
  if (error.message.includes('not connected') || error.message.includes('Platform not connected')) {
    return `${platformName} account not connected. Please connect your account in Settings.`;
  }

  if (error.message.includes('OAuth not configured')) {
    return `${platformName} integration is not configured. Please contact support.`;
  }

  if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
    return `${platformName} rate limit exceeded. Please try again later.`;
  }

  if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
    return `${platformName} authentication failed. Please reconnect your account.`;
  }

  // Default error message
  return `Failed to post to ${platformName}: ${error.message}`;
}

/**
 * Check if user can publish to platform (connected and authorized)
 */
export async function canPublishToPlatform(
  platform: Platform,
  projectId?: string
): Promise<boolean> {
  try {
    const isConnected = await isPlatformConnected(platform, projectId);
    return isConnected;
  } catch (error) {
    logger.error('Failed to check publish capability', error, { platform });
    return false;
  }
}

/**
 * Get optimal hashtag count for platform
 */
export function getOptimalHashtagCount(platform: Platform): number {
  const constraints = PLATFORM_CONSTRAINTS[platform];

  if (!constraints.supportsHashtags) {
    return 0;
  }

  // Return recommended hashtag count (not maximum)
  const recommendations: Record<Platform, number> = {
    twitter: 2,
    instagram: 10,
    linkedin: 3,
    facebook: 2,
    youtube: 5,
    tiktok: 5,
    pinterest: 5,
    reddit: 0,
    blog: 5,
  };

  return recommendations[platform] || 0;
}
