// Platform API utilities for making authenticated requests to social media platforms
import { supabase } from './supabase/client';
import { oauthAPI, setAuthToken } from './api';

export interface PlatformPost {
  content: string;
  media?: string[];
  scheduledTime?: string;
}

/**
 * Get OAuth access token for a platform
 */
async function getAccessToken(platform: string, projectId: string): Promise<string> {
  // Ensure we have a fresh auth token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated');
  }

  // Update auth token for API calls
  setAuthToken(session.access_token);

  // Use centralized OAuth API
  const data = await oauthAPI.getToken(platform, projectId);
  return data.accessToken;
}

/**
 * Post to Twitter/X
 */
export async function postToTwitter(
  projectId: string,
  post: PlatformPost
): Promise<any> {
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

  return await response.json();
}

/**
 * Post to LinkedIn
 */
export async function postToLinkedIn(
  projectId: string,
  post: PlatformPost
): Promise<any> {
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

  return await response.json();
}

/**
 * Post to Facebook Page
 */
export async function postToFacebook(
  projectId: string,
  post: PlatformPost,
  pageId?: string
): Promise<any> {
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

  return await response.json();
}

/**
 * Post to Reddit
 */
export async function postToReddit(
  projectId: string,
  post: PlatformPost,
  subreddit: string
): Promise<any> {
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

  return await response.json();
}

/**
 * Post to Instagram (requires media)
 */
export async function postToInstagram(
  projectId: string,
  post: PlatformPost,
  imageUrl: string
): Promise<any> {
  const accessToken = await getAccessToken('instagram', projectId);

  // Note: Instagram API requires media. This is a simplified example.
  // Real implementation needs to handle image upload and container creation.
  
  throw new Error('Instagram posting requires media upload - implement based on your needs');
}

/**
 * Post to Pinterest
 */
export async function postToPinterest(
  projectId: string,
  post: PlatformPost,
  boardId: string,
  imageUrl: string
): Promise<any> {
  const accessToken = await getAccessToken('pinterest', projectId);

  const response = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      board_id: boardId,
      description: post.content,
      media_source: {
        source_type: 'image_url',
        url: imageUrl,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinterest post failed: ${error}`);
  }

  return await response.json();
}

/**
 * Upload video to YouTube
 */
export async function uploadToYouTube(
  projectId: string,
  post: PlatformPost,
  videoFile: File
): Promise<any> {
  const accessToken = await getAccessToken('youtube', projectId);

  // This is a simplified example. Real YouTube upload requires:
  // 1. Resumable upload session
  // 2. Video metadata
  // 3. Proper error handling
  
  throw new Error('YouTube upload requires resumable upload - implement based on your needs');
}

/**
 * Post to TikTok
 */
export async function postToTikTok(
  projectId: string,
  post: PlatformPost,
  videoUrl: string
): Promise<any> {
  const accessToken = await getAccessToken('tiktok', projectId);

  // TikTok API requires video upload
  throw new Error('TikTok posting requires video upload - implement based on your needs');
}

/**
 * Generic platform post function - routes to correct platform
 */
export async function postToPlatform(
  platform: string,
  projectId: string,
  post: PlatformPost,
  options?: any
): Promise<any> {
  switch (platform) {
    case 'twitter':
      return postToTwitter(projectId, post);
    
    case 'linkedin':
      return postToLinkedIn(projectId, post);
    
    case 'facebook':
      return postToFacebook(projectId, post, options?.pageId);
    
    case 'reddit':
      if (!options?.subreddit) {
        throw new Error('Subreddit is required for Reddit posts');
      }
      return postToReddit(projectId, post, options.subreddit);
    
    case 'pinterest':
      if (!options?.boardId || !options?.imageUrl) {
        throw new Error('Board ID and image URL are required for Pinterest');
      }
      return postToPinterest(projectId, post, options.boardId, options.imageUrl);
    
    case 'instagram':
    case 'youtube':
    case 'tiktok':
      throw new Error(`${platform} posting requires additional implementation for media uploads`);
    
    default:
      throw new Error(`Platform ${platform} not supported`);
  }
}

/**
 * Check if a platform connection is valid
 */
export async function validateConnection(
  platform: string,
  projectId: string
): Promise<boolean> {
  try {
    await getAccessToken(platform, projectId);
    return true;
  } catch (error) {
    return false;
  }
}
