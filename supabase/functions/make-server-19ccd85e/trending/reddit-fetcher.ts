/**
 * Reddit Trending Posts Fetcher
 *
 * Fetches trending (hot) posts from Reddit without authentication
 * using the public JSON API.
 *
 * Features:
 * - No authentication required
 * - Fetches from multiple subreddits
 * - Normalizes data to common format
 * - Calculates trending scores
 * - Rate limit friendly
 */

export interface RedditPost {
  id: string;
  title: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  selftext: string;
  subreddit: string;
  thumbnail?: string;
  preview?: {
    images?: Array<{
      source?: {
        url?: string;
      };
    }>;
  };
}

export interface RedditApiResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

export interface NormalizedTrendingPost {
  id: string;
  platform: 'reddit';
  author: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: string;
  image?: string;
  engagement: {
    likes: number;
    comments: number;
  };
  trending_score: number;
  hashtags: string[];
  url: string;
  created_at: string;
  niche: string;
}

/**
 * Default subreddits to fetch trending posts from
 * Categorized by niche for better relevance
 */
const DEFAULT_SUBREDDITS: Record<string, string[]> = {
  programming: ['programming', 'webdev', 'javascript', 'reactjs', 'typescript'],
  technology: ['technology', 'gadgets', 'futurology', 'artificial'],
  business: ['startups', 'Entrepreneur', 'marketing', 'smallbusiness'],
  design: ['design', 'web_design', 'userexperience', 'graphic_design'],
  general: ['popular', 'all', 'news', 'todayilearned'],
};

/**
 * Fetch trending posts from a specific subreddit
 *
 * @param subreddit - Subreddit name (without /r/)
 * @param limit - Number of posts to fetch (max 100)
 * @returns Array of Reddit posts
 */
export async function fetchRedditSubreddit(
  subreddit: string,
  limit: number = 25
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${Math.min(limit, 100)}`;

  try {
    const response = await fetch(url, {
      headers: {
        // Required custom User-Agent to avoid rate limiting
        'User-Agent': 'PubHub/1.0.0 (Social Media Management Tool)',
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }

    const data: RedditApiResponse = await response.json();

    // Filter out removed/deleted posts
    return data.data.children
      .map((child) => child.data)
      .filter((post) => post.author !== '[deleted]' && post.title);
  } catch (error) {
    console.error(`Failed to fetch from r/${subreddit}:`, error);
    throw error;
  }
}

/**
 * Calculate trending score based on engagement metrics
 *
 * Formula: (score * 0.7) + (num_comments * 0.3)
 * Normalized to 0-100 scale
 *
 * @param post - Reddit post
 * @returns Trending score (0-100)
 */
function calculateTrendingScore(post: RedditPost): number {
  const scoreWeight = 0.7;
  const commentsWeight = 0.3;

  // Raw score calculation
  const rawScore = post.score * scoreWeight + post.num_comments * commentsWeight;

  // Normalize to 0-100 scale (logarithmic to handle viral posts)
  // Using log10 to compress large numbers
  const normalizedScore = Math.min(100, Math.log10(rawScore + 1) * 20);

  return Math.round(normalizedScore);
}

/**
 * Extract hashtags from post title and content
 *
 * @param title - Post title
 * @param selftext - Post content
 * @returns Array of hashtags (without #)
 */
function extractHashtags(title: string, selftext: string): string[] {
  const text = `${title} ${selftext}`;
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);

  if (!matches) return [];

  // Remove # and deduplicate
  return [...new Set(matches.map((tag) => tag.slice(1)))];
}

/**
 * Extract best image from Reddit post
 *
 * @param post - Reddit post
 * @returns Image URL or undefined
 */
function extractImage(post: RedditPost): string | undefined {
  // Check preview images first (highest quality)
  if (post.preview?.images?.[0]?.source?.url) {
    // Decode HTML entities in URL
    return post.preview.images[0].source.url.replace(/&amp;/g, '&');
  }

  // Check thumbnail (lower quality fallback)
  if (post.thumbnail && post.thumbnail.startsWith('http')) {
    return post.thumbnail;
  }

  return undefined;
}

/**
 * Normalize Reddit post to common trending post format
 *
 * @param post - Reddit post
 * @param niche - Content category/niche
 * @returns Normalized trending post
 */
function normalizeRedditPost(post: RedditPost, niche: string): NormalizedTrendingPost {
  return {
    id: `reddit_${post.id}`,
    platform: 'reddit',
    author: {
      username: post.author,
      displayName: post.author,
      avatar: `https://www.reddit.com/user/${post.author}/avatar`, // Reddit avatar URL pattern
    },
    content: post.title,
    image: extractImage(post),
    engagement: {
      likes: post.score,
      comments: post.num_comments,
    },
    trending_score: calculateTrendingScore(post),
    hashtags: extractHashtags(post.title, post.selftext),
    url: `https://www.reddit.com${post.permalink}`,
    created_at: new Date(post.created_utc * 1000).toISOString(),
    niche,
  };
}

/**
 * Fetch trending posts from Reddit for a specific category
 *
 * @param category - Category name (programming, technology, business, etc.)
 * @param count - Total number of posts to return
 * @returns Array of normalized trending posts
 */
export async function fetchRedditTrending(
  category: string = 'general',
  count: number = 25
): Promise<NormalizedTrendingPost[]> {
  const subreddits = DEFAULT_SUBREDDITS[category] || DEFAULT_SUBREDDITS.general;

  // Calculate posts per subreddit (distribute evenly)
  const postsPerSubreddit = Math.ceil(count / subreddits.length);

  // Fetch from all subreddits in parallel
  const fetchPromises = subreddits.map(async (subreddit) => {
    try {
      const posts = await fetchRedditSubreddit(subreddit, postsPerSubreddit);
      return posts.map((post) => normalizeRedditPost(post, category));
    } catch (error) {
      console.error(`Failed to fetch from r/${subreddit}:`, error);
      return []; // Return empty array on failure
    }
  });

  // Wait for all fetches to complete
  const results = await Promise.all(fetchPromises);

  // Flatten and sort by trending score
  const allPosts = results.flat().sort((a, b) => b.trending_score - a.trending_score);

  // Return top N posts
  return allPosts.slice(0, count);
}

/**
 * Fetch trending posts from all categories
 *
 * @param count - Total number of posts to return
 * @returns Array of normalized trending posts from all categories
 */
export async function fetchRedditTrendingAll(count: number = 25): Promise<NormalizedTrendingPost[]> {
  const categories = Object.keys(DEFAULT_SUBREDDITS);
  const postsPerCategory = Math.ceil(count / categories.length);

  // Fetch from all categories in parallel
  const fetchPromises = categories.map(async (category) => {
    try {
      return await fetchRedditTrending(category, postsPerCategory);
    } catch (error) {
      console.error(`Failed to fetch category ${category}:`, error);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);

  // Flatten and sort by trending score
  const allPosts = results.flat().sort((a, b) => b.trending_score - a.trending_score);

  // Return top N posts
  return allPosts.slice(0, count);
}
