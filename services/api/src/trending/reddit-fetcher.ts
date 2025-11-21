/**
 * Reddit Trending Posts Fetcher
 * Fetches trending (hot) posts from Reddit without authentication
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

const DEFAULT_SUBREDDITS: Record<string, string[]> = {
  programming: ['programming', 'webdev', 'javascript', 'reactjs', 'typescript'],
  technology: ['technology', 'gadgets', 'futurology', 'artificial'],
  business: ['startups', 'Entrepreneur', 'marketing', 'smallbusiness'],
  design: ['design', 'web_design', 'userexperience', 'graphic_design'],
  general: ['popular', 'all', 'news', 'todayilearned'],
};

export async function fetchRedditSubreddit(
  subreddit: string,
  limit: number = 25
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${Math.min(limit, 100)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PubHub/1.0.0 (Social Media Management Tool)',
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }

    const data: RedditApiResponse = await response.json();

    return data.data.children
      .map((child) => child.data)
      .filter((post) => post.author !== '[deleted]' && post.title);
  } catch (error) {
    console.error(`Failed to fetch from r/${subreddit}:`, error);
    throw error;
  }
}

function calculateTrendingScore(post: RedditPost): number {
  const scoreWeight = 0.7;
  const commentsWeight = 0.3;
  const rawScore = post.score * scoreWeight + post.num_comments * commentsWeight;
  const normalizedScore = Math.min(100, Math.log10(rawScore + 1) * 20);
  return Math.round(normalizedScore);
}

function extractHashtags(title: string, selftext: string): string[] {
  const text = `${title} ${selftext}`;
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  return [...new Set(matches.map((tag) => tag.slice(1)))];
}

function extractImage(post: RedditPost): string | undefined {
  if (post.preview?.images?.[0]?.source?.url) {
    return post.preview.images[0].source.url.replace(/&amp;/g, '&');
  }
  if (post.thumbnail && post.thumbnail.startsWith('http')) {
    return post.thumbnail;
  }
  return undefined;
}

function normalizeRedditPost(post: RedditPost, niche: string): NormalizedTrendingPost {
  return {
    id: `reddit_${post.id}`,
    platform: 'reddit',
    author: {
      username: post.author,
      displayName: post.author,
      avatar: `https://www.reddit.com/user/${post.author}/avatar`,
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

export async function fetchRedditTrending(
  category: string = 'general',
  count: number = 25
): Promise<NormalizedTrendingPost[]> {
  const subreddits = DEFAULT_SUBREDDITS[category] || DEFAULT_SUBREDDITS.general;
  const postsPerSubreddit = Math.ceil(count / subreddits.length);

  const fetchPromises = subreddits.map(async (subreddit) => {
    try {
      const posts = await fetchRedditSubreddit(subreddit, postsPerSubreddit);
      return posts.map((post) => normalizeRedditPost(post, category));
    } catch (error) {
      console.error(`Failed to fetch from r/${subreddit}:`, error);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  const allPosts = results.flat().sort((a, b) => b.trending_score - a.trending_score);
  return allPosts.slice(0, count);
}

export async function fetchRedditTrendingAll(count: number = 25): Promise<NormalizedTrendingPost[]> {
  const categories = Object.keys(DEFAULT_SUBREDDITS);
  const postsPerCategory = Math.ceil(count / categories.length);

  const fetchPromises = categories.map(async (category) => {
    try {
      return await fetchRedditTrending(category, postsPerCategory);
    } catch (error) {
      console.error(`Failed to fetch category ${category}:`, error);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  const allPosts = results.flat().sort((a, b) => b.trending_score - a.trending_score);
  return allPosts.slice(0, count);
}

