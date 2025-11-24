/**
 * Content fetching utilities for different platforms
 */

import { extractTextFromHTML, cleanText } from './textUtils';

export interface FetchedContent {
  title: string;
  text: string;
  contentType: 'article' | 'video_transcript' | 'social_post' | 'pdf';
  metadata: Record<string, any>;
}

/**
 * Fetch content from a URL
 */
export async function fetchURL(url: string): Promise<FetchedContent> {
  const platform = detectPlatform(url);

  switch (platform) {
    case 'youtube':
      return await fetchYouTubeContent(url);
    case 'twitter':
      return await fetchTwitterContent(url);
    case 'blog':
    default:
      return await fetchGenericWebContent(url);
  }
}

/**
 * Detect platform from URL
 */
function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  }
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'twitter';
  }
  if (urlLower.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (urlLower.includes('instagram.com')) {
    return 'instagram';
  }
  if (urlLower.includes('linkedin.com')) {
    return 'linkedin';
  }

  return 'blog';
}

/**
 * Fetch generic web content (blog posts, articles)
 */
async function fetchGenericWebContent(url: string): Promise<FetchedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PubHub/1.0; +https://pubhub.dev)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const text = extractTextFromHTML(html);

    // Try to extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;

    // Extract meta description if available
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1] : '';

    return {
      title,
      text: cleanText(text),
      contentType: 'article',
      metadata: {
        url,
        description,
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch ${url}: ${error.message}`);
  }
}

/**
 * Fetch YouTube video content (transcript via API)
 * Note: This is a placeholder - full implementation requires YouTube API key
 */
async function fetchYouTubeContent(url: string): Promise<FetchedContent> {
  // Extract video ID
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // For now, fetch the page and extract metadata
  // TODO: Implement proper YouTube Data API integration for transcripts
  const response = await fetch(url);
  const html = await response.text();

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'YouTube Video';

  // Extract description from meta tags
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1] : '';

  return {
    title,
    text: cleanText(description),
    contentType: 'video_transcript',
    metadata: {
      url,
      videoId,
      platform: 'youtube',
      fetchedAt: new Date().toISOString(),
      note: 'Full transcript requires YouTube Data API integration',
    },
  };
}

/**
 * Fetch Twitter/X content
 * Note: This requires Twitter API access
 */
async function fetchTwitterContent(url: string): Promise<FetchedContent> {
  // For now, just fetch the page
  // TODO: Implement proper Twitter API integration
  const response = await fetch(url);
  const html = await response.text();

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(' / X', '').trim() : 'Tweet';

  // Try to extract tweet text from meta tags
  const tweetMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  const tweetText = tweetMatch ? tweetMatch[1] : '';

  return {
    title,
    text: cleanText(tweetText),
    contentType: 'social_post',
    metadata: {
      url,
      platform: 'twitter',
      fetchedAt: new Date().toISOString(),
      note: 'Full access requires Twitter API integration',
    },
  };
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

