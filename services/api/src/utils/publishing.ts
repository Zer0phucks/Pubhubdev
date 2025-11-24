import * as kv from '../db/kv-store';
import { getOAuthConfig } from '../oauth/oauth-config';

export interface PlatformPost {
  content: string;
  media?: string[];
  scheduledTime?: string;
}

export interface PlatformPublishResult {
  platform: string;
  success: boolean;
  message?: string;
  postId?: string;
  url?: string;
  error?: string;
}

async function getAccessToken(platform: string, projectId: string): Promise<string> {
  const tokenRecord = await kv.get(`oauth:token:${platform}:${projectId}`);

  if (!tokenRecord) {
    throw new Error(`No access token found for ${platform}`);
  }

  // Check if token expired and needs refresh
  if (
    (tokenRecord as any).expiresAt &&
    Date.now() > (tokenRecord as any).expiresAt &&
    (tokenRecord as any).refreshToken
  ) {
    // Refresh the token
    const config = getOAuthConfig(platform);

    if (config) {
      try {
        const refreshParams = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: (tokenRecord as any).refreshToken,
          client_id: config.clientId!,
          client_secret: config.clientSecret!,
        });

        const refreshResponse = await fetch(config.tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: refreshParams.toString(),
        });

        if (refreshResponse.ok) {
          const newTokenData = (await refreshResponse.json()) as { access_token: string; refresh_token?: string; expires_in?: number };

          // Update stored token
          const updatedRecord = {
            ...tokenRecord,
            accessToken: newTokenData.access_token,
            refreshToken: newTokenData.refresh_token || (tokenRecord as any).refreshToken,
            expiresAt: newTokenData.expires_in
              ? Date.now() + newTokenData.expires_in * 1000
              : null,
          };

          await kv.set(`oauth:token:${platform}:${projectId}`, updatedRecord);

          return newTokenData.access_token;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }
  }

  return (tokenRecord as any).accessToken;
}

export async function postToTwitter(
  projectId: string,
  post: PlatformPost
): Promise<PlatformPublishResult> {
  try {
    const accessToken = await getAccessToken('twitter', projectId);

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: post.content,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twitter post failed: ${error}`);
    }

    const data = await response.json();
    return {
      platform: 'twitter',
      success: true,
      postId: data.data.id,
      message: 'Posted to Twitter',
    };
  } catch (error: any) {
    return {
      platform: 'twitter',
      success: false,
      error: error.message,
    };
  }
}

export async function postToLinkedIn(
  projectId: string,
  post: PlatformPost
): Promise<PlatformPublishResult> {
  try {
    const accessToken = await getAccessToken('linkedin', projectId);

    // Get user's LinkedIn ID first
    const meResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!meResponse.ok) {
      throw new Error('Failed to get LinkedIn user info');
    }

    const meData = await meResponse.json();
    const personId = meData.id;

    // Create post
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: post.content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn post failed: ${error}`);
    }

    const data = await response.json();
    return {
      platform: 'linkedin',
      success: true,
      postId: data.id,
      message: 'Posted to LinkedIn',
    };
  } catch (error: any) {
    return {
      platform: 'linkedin',
      success: false,
      error: error.message,
    };
  }
}

export async function postToFacebook(
  projectId: string,
  post: PlatformPost,
  pageId?: string
): Promise<PlatformPublishResult> {
  try {
    const accessToken = await getAccessToken('facebook', projectId);

    // If no pageId provided, get the first page
    if (!pageId) {
      const pagesResponse = await fetch(
        `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
      );
      const pagesData = await pagesResponse.json();
      
      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook pages found');
      }
      
      pageId = pagesData.data[0].id;
    }

    const response = await fetch(
      `https://graph.facebook.com/${pageId}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: post.content,
          access_token: accessToken,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Facebook post failed: ${error}`);
    }

    const data = await response.json();
    return {
      platform: 'facebook',
      success: true,
      postId: data.id,
      message: 'Posted to Facebook',
    };
  } catch (error: any) {
    return {
      platform: 'facebook',
      success: false,
      error: error.message,
    };
  }
}

export async function postToReddit(
  projectId: string,
  post: PlatformPost,
  subreddit: string
): Promise<PlatformPublishResult> {
  try {
    const accessToken = await getAccessToken('reddit', projectId);

    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PubHub/1.0',
      },
      body: new URLSearchParams({
        sr: subreddit,
        kind: 'self',
        title: post.content.split('\n')[0].slice(0, 300), // First line as title
        text: post.content,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Reddit post failed: ${error}`);
    }

    const data = await response.json();
    return {
      platform: 'reddit',
      success: true,
      postId: data.json?.data?.id,
      message: 'Posted to Reddit',
    };
  } catch (error: any) {
    return {
      platform: 'reddit',
      success: false,
      error: error.message,
    };
  }
}

export async function postToPlatform(
  platform: string,
  projectId: string,
  post: PlatformPost,
  options?: Record<string, unknown>
): Promise<PlatformPublishResult> {
  switch (platform) {
    case 'twitter':
      return postToTwitter(projectId, post);
    
    case 'linkedin':
      return postToLinkedIn(projectId, post);
    
    case 'facebook':
      return postToFacebook(projectId, post, options?.pageId as string);
    
    case 'reddit':
      if (!options?.subreddit) {
        return { platform, success: false, error: 'Subreddit is required for Reddit posts' };
      }
      return postToReddit(projectId, post, options.subreddit as string);
    
    case 'pinterest':
    case 'instagram':
    case 'youtube':
    case 'tiktok':
      return { platform, success: false, error: `${platform} posting requires additional implementation for media uploads` };
    
    default:
      return { platform, success: false, error: `Platform ${platform} not supported` };
  }
}
