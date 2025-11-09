import { Platform, PlatformConstraints } from '../types';

export interface PlatformConfig {
  id: Platform;
  name: string;
  displayName: string;
  color: string;
  gradient: string;
  iconGradient: string;
  description: string;
  constraints: PlatformConstraints;
  requiresAuth: boolean;
  supportsOAuth: boolean;
}

/**
 * Complete platform configuration including constraints, branding, and capabilities
 */
export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: {
    id: 'twitter',
    name: 'Twitter',
    displayName: 'Twitter / X',
    color: '#1DA1F2',
    gradient: 'from-blue-500 to-cyan-600',
    iconGradient: 'from-blue-500 to-cyan-500',
    description: 'Connect your Twitter account to post tweets and threads',
    constraints: {
      maxLength: 280,
      maxImages: 4,
      maxVideos: 1,
      supportsThreads: true,
      supportsHashtags: true,
      maxHashtags: 5,
    },
    requiresAuth: true,
    supportsOAuth: true,
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    displayName: 'Instagram',
    color: '#E1306C',
    gradient: 'from-pink-500 to-purple-600',
    iconGradient: 'from-pink-500 to-rose-500',
    description: 'Share photos, reels, and stories on Instagram',
    constraints: {
      maxLength: 2200,
      maxImages: 10,
      maxVideos: 1,
      supportsThreads: false,
      supportsHashtags: true,
      maxHashtags: 30,
    },
    requiresAuth: true,
    supportsOAuth: true,
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    displayName: 'LinkedIn',
    color: '#0A66C2',
    gradient: 'from-blue-600 to-blue-700',
    iconGradient: 'from-blue-600 to-blue-700',
    description: 'Post professional content and articles on LinkedIn',
    constraints: {
      maxLength: 3000,
      maxImages: 9,
      maxVideos: 1,
      supportsThreads: false,
      supportsHashtags: true,
      maxHashtags: 10,
    },
    requiresAuth: true,
    supportsOAuth: true,
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    displayName: 'Facebook',
    color: '#1877F2',
    gradient: 'from-blue-500 to-blue-700',
    iconGradient: 'from-blue-500 to-blue-700',
    description: 'Share updates on your Facebook page',
    constraints: {
      maxLength: 63206,
      maxImages: 10,
      maxVideos: 1,
      supportsThreads: false,
      supportsHashtags: true,
    },
    requiresAuth: true,
    supportsOAuth: true,
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    displayName: 'YouTube',
    color: '#FF0000',
    gradient: 'from-red-500 to-red-700',
    iconGradient: 'from-red-500 to-red-700',
    description: 'Upload videos and manage your YouTube channel',
    constraints: {
      maxLength: 5000,
      maxImages: 1,
      maxVideos: 1,
      supportsThreads: false,
      supportsHashtags: true,
      maxHashtags: 15,
    },
    requiresAuth: true,
    supportsOAuth: true,
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    displayName: 'TikTok',
    color: '#000000',
    gradient: 'from-cyan-400 to-pink-500',
    iconGradient: 'from-cyan-400 to-pink-500',
    description: 'Create and share short-form videos on TikTok',
    constraints: {
      maxLength: 2200,
      maxImages: 35,
      maxVideos: 1,
      supportsThreads: false,
      supportsHashtags: true,
      maxHashtags: 10,
    },
    requiresAuth: true,
    supportsOAuth: true,
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    displayName: 'Pinterest',
    color: '#E60023',
    gradient: 'from-red-500 to-red-600',
    iconGradient: 'from-red-500 to-red-600',
    description: 'Pin your content and ideas on Pinterest boards',
    constraints: {
      maxLength: 500,
      maxImages: 1,
      maxVideos: 1,
      supportsThreads: false,
      supportsHashtags: true,
    },
    requiresAuth: true,
    supportsOAuth: true,
  },
  reddit: {
    id: 'reddit',
    name: 'Reddit',
    displayName: 'Reddit',
    color: '#FF4500',
    gradient: 'from-orange-500 to-red-600',
    iconGradient: 'from-orange-500 to-red-600',
    description: 'Engage with communities and share content on Reddit',
    constraints: {
      maxLength: 40000,
      maxImages: 20,
      maxVideos: 1,
      supportsThreads: true,
      supportsHashtags: false,
    },
    requiresAuth: true,
    supportsOAuth: true,
  },
  blog: {
    id: 'blog',
    name: 'Blog',
    displayName: 'Blog / WordPress',
    color: '#21759B',
    gradient: 'from-purple-500 to-indigo-600',
    iconGradient: 'from-purple-500 to-indigo-600',
    description: 'Publish articles and posts to your WordPress, Medium, or custom blog',
    constraints: {
      maxLength: 100000,
      maxImages: 50,
      maxVideos: 10,
      supportsThreads: false,
      supportsHashtags: true,
    },
    requiresAuth: true,
    supportsOAuth: false, // Blog uses custom WordPress credentials
  },
};

/**
 * Platform colors for quick access
 */
export const PLATFORM_COLORS: Record<Platform, string> = Object.fromEntries(
  Object.entries(PLATFORM_CONFIGS).map(([key, config]) => [key, config.color])
) as Record<Platform, string>;

/**
 * Platform gradients for quick access
 */
export const PLATFORM_GRADIENTS: Record<Platform, string> = Object.fromEntries(
  Object.entries(PLATFORM_CONFIGS).map(([key, config]) => [key, config.gradient])
) as Record<Platform, string>;

/**
 * Platform display names for quick access
 */
export const PLATFORM_NAMES: Record<Platform, string> = Object.fromEntries(
  Object.entries(PLATFORM_CONFIGS).map(([key, config]) => [key, config.displayName])
) as Record<Platform, string>;

/**
 * All available platforms
 */
export const ALL_PLATFORMS: Platform[] = Object.keys(PLATFORM_CONFIGS) as Platform[];

/**
 * OAuth-enabled platforms
 */
export const OAUTH_PLATFORMS: Platform[] = ALL_PLATFORMS.filter(
  (platform) => PLATFORM_CONFIGS[platform].supportsOAuth
);

/**
 * Platforms that support threading
 */
export const THREAD_PLATFORMS: Platform[] = ALL_PLATFORMS.filter(
  (platform) => PLATFORM_CONFIGS[platform].constraints.supportsThreads
);

/**
 * Platforms that support hashtags
 */
export const HASHTAG_PLATFORMS: Platform[] = ALL_PLATFORMS.filter(
  (platform) => PLATFORM_CONFIGS[platform].constraints.supportsHashtags
);
