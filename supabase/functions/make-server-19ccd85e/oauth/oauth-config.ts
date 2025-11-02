// Centralized OAuth configuration for all platforms
// Single source of truth for OAuth settings

export interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
  scope: string;
  redirectUri: string;
  authMethod: 'standard' | 'pkce' | 'basic_auth'; // How to authenticate token exchange
  requiresPKCE: boolean; // Whether platform requires PKCE
  includeClientIdInTokenBody?: boolean; // Some providers expect client_id even with Basic auth
  includeClientSecretInTokenBody?: boolean; // Optional client_secret in token body for special cases
}

const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://pubhub.dev';
const baseRedirectUri =
  (Deno.env.get('OAUTH_REDIRECT_URL') || `${frontendUrl}/oauth/callback`).trim();

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
  const envValue = envKey ? Deno.env.get(envKey)?.trim() : undefined;
  if (envValue) {
    return applyPlatformPlaceholder(envValue, platform);
  }
  return buildRedirectFromBase(platform);
}

/**
 * Get OAuth configuration for a platform
 */
export function getOAuthConfig(platform: string): OAuthConfig | null {
  const configs: Record<string, OAuthConfig> = {
    twitter: {
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      clientId: Deno.env.get('TWITTER_CLIENT_ID'),
      clientSecret: Deno.env.get('TWITTER_CLIENT_SECRET'),
      scope: 'tweet.read tweet.write users.read offline.access',
      redirectUri: resolveRedirectUri('twitter', 'TWITTER_REDIRECT_URI'),
      authMethod: 'basic_auth',
      requiresPKCE: true, // Twitter requires PKCE for OAuth 2.0
      includeClientIdInTokenBody: true,
    },
    instagram: {
      // Instagram now uses Facebook Graph API (Basic Display API deprecated Dec 2024)
      // Uses Facebook Login - additional permissions need to be requested through App Review
      // For now, using basic scopes to establish OAuth flow
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      clientId: Deno.env.get('INSTAGRAM_APP_ID') || Deno.env.get('FACEBOOK_APP_ID'),
      clientSecret: Deno.env.get('INSTAGRAM_APP_SECRET') || Deno.env.get('FACEBOOK_APP_SECRET'),
      scope: 'email,public_profile',
      redirectUri: resolveRedirectUri('instagram', 'INSTAGRAM_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
    },
    linkedin: {
      // Using modern LinkedIn API v2 scopes (r_liteprofile deprecated)
      // Basic scopes that don't require LinkedIn verification
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientId: Deno.env.get('LINKEDIN_CLIENT_ID'),
      clientSecret: Deno.env.get('LINKEDIN_CLIENT_SECRET'),
      scope: 'openid profile email',
      redirectUri: resolveRedirectUri('linkedin', 'LINKEDIN_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
    },
    facebook: {
      // Using basic Facebook Login scopes that don't require App Review
      // Pages permissions (pages_manage_posts, pages_read_engagement) require App Review
      // For now, using basic scopes to establish OAuth flow
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      clientId: Deno.env.get('FACEBOOK_APP_ID'),
      clientSecret: Deno.env.get('FACEBOOK_APP_SECRET'),
      scope: 'email,public_profile',
      redirectUri: resolveRedirectUri('facebook', 'FACEBOOK_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
    },
    youtube: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: Deno.env.get('YOUTUBE_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID'),
      clientSecret:
        Deno.env.get('YOUTUBE_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET'),
      scope:
        'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
      redirectUri: resolveRedirectUri('youtube', 'YOUTUBE_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
    },
    tiktok: {
      authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      clientId: Deno.env.get('TIKTOK_CLIENT_KEY'),
      clientSecret: Deno.env.get('TIKTOK_CLIENT_SECRET'),
      scope: 'user.info.basic,video.upload',
      redirectUri: resolveRedirectUri('tiktok', 'TIKTOK_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
    },
    pinterest: {
      authUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      clientId: Deno.env.get('PINTEREST_APP_ID'),
      clientSecret: Deno.env.get('PINTEREST_APP_SECRET'),
      scope: 'boards:read,pins:read,pins:write',
      redirectUri: resolveRedirectUri('pinterest', 'PINTEREST_REDIRECT_URI'),
      authMethod: 'standard',
      requiresPKCE: false,
    },
    reddit: {
      authUrl: 'https://www.reddit.com/api/v1/authorize',
      tokenUrl: 'https://www.reddit.com/api/v1/access_token',
      clientId: Deno.env.get('REDDIT_CLIENT_ID'),
      clientSecret: Deno.env.get('REDDIT_CLIENT_SECRET'),
      scope: 'submit,identity',
      redirectUri: resolveRedirectUri('reddit', 'REDDIT_REDIRECT_URI'),
      authMethod: 'basic_auth', // Reddit requires Basic Auth header
      requiresPKCE: false,
    },
  };

  return configs[platform] || null;
}

/**
 * Validate that a platform's OAuth configuration is complete
 */
export function validateOAuthConfig(
  config: OAuthConfig | null,
  platform: string,
): { valid: boolean; missing?: string[] } {
  if (!config) {
    return { valid: false, missing: ['Configuration not found'] };
  }

  const missing: string[] = [];

  if (!config.clientId) {
    missing.push(`CLIENT_ID for ${platform}`);
  }

  if (!config.clientSecret && config.authMethod !== 'pkce') {
    missing.push(`CLIENT_SECRET for ${platform}`);
  }

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
}

