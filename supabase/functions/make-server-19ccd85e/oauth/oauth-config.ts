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
}

/**
 * Get OAuth configuration for a platform
 */
export function getOAuthConfig(platform: string): OAuthConfig | null {
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://pubhub.dev';
  const redirectUri = `${frontendUrl}/oauth/callback`;
  
  const configs: Record<string, OAuthConfig> = {
    twitter: {
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      clientId: Deno.env.get('TWITTER_CLIENT_ID'),
      clientSecret: Deno.env.get('TWITTER_CLIENT_SECRET'),
      scope: 'tweet.read tweet.write users.read offline.access',
      redirectUri: `${frontendUrl}/oauth/callback?platform=twitter`,
      authMethod: 'standard',
      requiresPKCE: true, // Twitter requires PKCE for OAuth 2.0
    },
    instagram: {
      authUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      clientId: Deno.env.get('INSTAGRAM_CLIENT_ID'),
      clientSecret: Deno.env.get('INSTAGRAM_CLIENT_SECRET'),
      scope: 'user_profile,user_media',
      redirectUri: Deno.env.get('INSTAGRAM_REDIRECT_URI') || redirectUri,
      authMethod: 'standard',
      requiresPKCE: false,
    },
    linkedin: {
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientId: Deno.env.get('LINKEDIN_CLIENT_ID'),
      clientSecret: Deno.env.get('LINKEDIN_CLIENT_SECRET'),
      scope: 'w_member_social r_liteprofile',
      redirectUri: Deno.env.get('LINKEDIN_REDIRECT_URI') || redirectUri,
      authMethod: 'standard',
      requiresPKCE: false,
    },
    facebook: {
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      clientId: Deno.env.get('FACEBOOK_APP_ID'),
      clientSecret: Deno.env.get('FACEBOOK_APP_SECRET'),
      scope: 'pages_manage_posts,pages_read_engagement',
      redirectUri: Deno.env.get('FACEBOOK_REDIRECT_URI') || redirectUri,
      authMethod: 'standard',
      requiresPKCE: false,
    },
    youtube: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: Deno.env.get('YOUTUBE_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID'),
      clientSecret: Deno.env.get('YOUTUBE_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET'),
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
      redirectUri: Deno.env.get('YOUTUBE_REDIRECT_URI') || Deno.env.get('OAUTH_REDIRECT_URL') || redirectUri,
      authMethod: 'standard',
      requiresPKCE: false,
    },
    tiktok: {
      authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      clientId: Deno.env.get('TIKTOK_CLIENT_KEY'),
      clientSecret: Deno.env.get('TIKTOK_CLIENT_SECRET'),
      scope: 'user.info.basic,video.upload',
      redirectUri: Deno.env.get('TIKTOK_REDIRECT_URI') || redirectUri,
      authMethod: 'standard',
      requiresPKCE: false,
    },
    pinterest: {
      authUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      clientId: Deno.env.get('PINTEREST_APP_ID'),
      clientSecret: Deno.env.get('PINTEREST_APP_SECRET'),
      scope: 'boards:read,pins:read,pins:write',
      redirectUri: Deno.env.get('PINTEREST_REDIRECT_URI') || redirectUri,
      authMethod: 'standard',
      requiresPKCE: false,
    },
    reddit: {
      authUrl: 'https://www.reddit.com/api/v1/authorize',
      tokenUrl: 'https://www.reddit.com/api/v1/access_token',
      clientId: Deno.env.get('REDDIT_CLIENT_ID'),
      clientSecret: Deno.env.get('REDDIT_CLIENT_SECRET'),
      scope: 'submit,identity',
      redirectUri: Deno.env.get('REDDIT_REDIRECT_URI') || redirectUri,
      authMethod: 'basic_auth', // Reddit requires Basic Auth header
      requiresPKCE: false,
    },
  };
  
  return configs[platform] || null;
}

/**
 * Validate that a platform's OAuth configuration is complete
 */
export function validateOAuthConfig(config: OAuthConfig | null, platform: string): { valid: boolean; missing?: string[] } {
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

