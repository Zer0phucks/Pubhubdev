import dotenv from 'dotenv';

dotenv.config();

export interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
  scope: string;
  redirectUri: string;
  authMethod: 'standard' | 'pkce' | 'basic_auth';
  requiresPKCE: boolean;
  includeClientIdInTokenBody?: boolean;
  includeClientSecretInTokenBody?: boolean;
  clientIdParamName?: string;
}

const frontendUrl = process.env.FRONTEND_URL || 'https://pubhub.dev';
const baseRedirectUri = (process.env.OAUTH_REDIRECT_URL || `${frontendUrl}/oauth/callback`).trim();

const PLATFORM_PLACEHOLDERS = [
  '{platform}',
  '{PLATFORM}',
  ':platform',
  ':PLATFORM',
  '%platform%',
  '%PLATFORM%',
  '${platform}',
  '${PLATFORM}',
];

function applyPlatformPlaceholder(template: string, platform: string): string {
  let result = template;
  for (const placeholder of PLATFORM_PLACEHOLDERS) {
    if (result.includes(placeholder)) {
      result = result.split(placeholder).join(platform);
    }
  }
  return result;
}

function buildRedirectFromBase(platform: string): string {
  if (!baseRedirectUri) {
    return `${frontendUrl}/oauth/callback?platform=${platform}`;
  }

  if (PLATFORM_PLACEHOLDERS.some((placeholder) => baseRedirectUri.includes(placeholder))) {
    return applyPlatformPlaceholder(baseRedirectUri, platform);
  }

  if (baseRedirectUri.toLowerCase().includes('platform=')) {
    return baseRedirectUri;
  }

  const separator = baseRedirectUri.includes('?')
    ? baseRedirectUri.endsWith('?') || baseRedirectUri.endsWith('&')
      ? ''
      : '&'
    : '?';

  return `${baseRedirectUri}${separator}platform=${platform}`;
}

function resolveRedirectUri(platform: string, envKey?: string): string {
  const envValue = envKey ? process.env[envKey]?.trim() : undefined;
  if (envValue) {
    return applyPlatformPlaceholder(envValue, platform);
  }
  return buildRedirectFromBase(platform);
}

export function getOAuthConfig(platform: string): OAuthConfig | null {
  const configs: Record<string, OAuthConfig> = {
    twitter: {
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      scope: 'tweet.read tweet.write users.read offline.access',
      redirectUri: resolveRedirectUri('twitter', 'TWITTER_REDIRECT_URI'),
      authMethod: 'basic_auth',
      requiresPKCE: true,
      includeClientIdInTokenBody: true,
    },
    instagram: {
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      clientId: process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET,
      scope: 'email,public_profile',
      redirectUri: resolveRedirectUri('instagram', 'INSTAGRAM_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
    },
    linkedin: {
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      scope: 'r_liteprofile r_emailaddress w_member_social',
      redirectUri: resolveRedirectUri('linkedin', 'LINKEDIN_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
    },
    facebook: {
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      scope: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts',
      redirectUri: resolveRedirectUri('facebook', 'FACEBOOK_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
    },
    youtube: {
      authUrl: 'https://accounts.google.com/o/oauth2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: process.env.YOUTUBE_CLIENT_ID,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
      redirectUri: resolveRedirectUri('youtube', 'YOUTUBE_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
    },
    reddit: {
      authUrl: 'https://www.reddit.com/api/v1/authorize',
      tokenUrl: 'https://www.reddit.com/api/v1/access_token',
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      scope: 'identity read submit',
      redirectUri: resolveRedirectUri('reddit', 'REDDIT_REDIRECT_URI'),
      authMethod: 'basic_auth',
      requiresPKCE: false,
    },
    tiktok: {
      authUrl: 'https://www.tiktok.com/oauth/authorize',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      clientId: process.env.TIKTOK_CLIENT_KEY,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET,
      scope: 'user.info.basic,video.upload',
      redirectUri: resolveRedirectUri('tiktok', 'TIKTOK_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
      clientIdParamName: 'client_key',
    },
    pinterest: {
      authUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      clientId: process.env.PINTEREST_CLIENT_ID,
      clientSecret: process.env.PINTEREST_CLIENT_SECRET,
      scope: 'boards:read,boards:write,pins:read,pins:write,user_accounts:read',
      redirectUri: resolveRedirectUri('pinterest', 'PINTEREST_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
    },
  };

  return configs[platform] || null;
}

