import { Card } from "./ui/card";
import { PlatformIcon } from "./PlatformIcon";
import { Badge } from "./ui/badge";
import { TrendingUp, Heart, MessageCircle, Share2, Eye, ThumbsUp, Repeat2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface TrendingPost {
  id: string;
  platform: Exclude<Platform, "all">;
  author: string;
  authorImage: string;
  content: string;
  image?: string;
  engagement: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    retweets?: number;
  };
  timestamp: string;
  niche: string;
  trendScore: number;
}

interface TrendingPostsProps {
  selectedPlatform: Platform;
}

const mockTrendingPosts: TrendingPost[] = [
  {
    id: "1",
    platform: "twitter",
    author: "@SarahTechVoice",
    authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    content: "Just shipped a new feature that our users have been requesting for months. The key? Actually listening to feedback and iterating quickly. 🚀\n\n#ProductDevelopment #StartupLife",
    engagement: {
      likes: 2847,
      comments: 183,
      retweets: 891,
      views: 45200,
    },
    timestamp: "2h ago",
    niche: "Tech & Startups",
    trendScore: 98,
  },
  {
    id: "2",
    platform: "instagram",
    author: "creative_studio_co",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    content: "Behind the scenes of our latest brand photoshoot ✨ Swipe to see the final results!",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&h=600&fit=crop",
    engagement: {
      likes: 15234,
      comments: 421,
      shares: 892,
    },
    timestamp: "4h ago",
    niche: "Creative & Design",
    trendScore: 95,
  },
  {
    id: "3",
    platform: "linkedin",
    author: "Marcus Chen",
    authorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    content: "After 5 years of building in public, here are the 3 things I wish I knew on day one:\n\n1. Your network is your net worth\n2. Consistency beats perfection\n3. Share your failures, not just wins\n\nWhat would you add to this list?",
    engagement: {
      likes: 3421,
      comments: 287,
      shares: 654,
    },
    timestamp: "6h ago",
    niche: "Business & Career",
    trendScore: 92,
  },
  {
    id: "4",
    platform: "tiktok",
    author: "fitness_with_emma",
    authorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    content: "15-min morning routine that changed my life 💪 No equipment needed!",
    engagement: {
      likes: 89234,
      comments: 1204,
      shares: 4521,
      views: 1240000,
    },
    timestamp: "8h ago",
    niche: "Health & Fitness",
    trendScore: 97,
  },
  {
    id: "5",
    platform: "youtube",
    author: "TechReview Hub",
    authorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    content: "M3 MacBook Pro vs M2: Is the upgrade worth it? Full comparison + benchmarks",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop",
    engagement: {
      likes: 12453,
      comments: 892,
      views: 342000,
    },
    timestamp: "12h ago",
    niche: "Tech Reviews",
    trendScore: 94,
  },
  {
    id: "6",
    platform: "pinterest",
    author: "HomeDesignDaily",
    authorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    content: "Scandinavian minimalist bedroom ideas for 2024",
    image: "https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=600&h=800&fit=crop",
    engagement: {
      likes: 8921,
      shares: 3421,
    },
    timestamp: "1d ago",
    niche: "Home & Interior",
    trendScore: 89,
  },
  {
    id: "7",
    platform: "reddit",
    author: "u/developer_insights",
    authorImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    content: "I analyzed 10,000 job postings to find the most in-demand programming skills in 2024. Results surprised me.",
    engagement: {
      likes: 4521,
      comments: 687,
    },
    timestamp: "18h ago",
    niche: "Programming",
    trendScore: 91,
  },
  {
    id: "8",
    platform: "facebook",
    author: "Local Foodie Adventures",
    authorImage: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop",
    content: "Found this hidden gem in downtown! The pasta is INCREDIBLE 🍝 Who wants to join me next time?",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=600&fit=crop",
    engagement: {
      likes: 1842,
      comments: 234,
      shares: 412,
    },
    timestamp: "10h ago",
    niche: "Food & Dining",
    trendScore: 86,
  },
];

export function TrendingPosts({ selectedPlatform }: TrendingPostsProps) {
  const filteredPosts = selectedPlatform === "all" 
    ? mockTrendingPosts 
    : mockTrendingPosts.filter(post => post.platform === selectedPlatform);

  // Sort by trend score
  const sortedPosts = [...filteredPosts].sort((a, b) => b.trendScore - a.trendScore);

  const getEngagementIcon = (platform: string, type: string) => {
    if (type === "likes") {
      if (platform === "twitter" || platform === "reddit") return Heart;
      if (platform === "linkedin" || platform === "facebook") return ThumbsUp;
      return Heart;
    }
    if (type === "comments") return MessageCircle;
    if (type === "shares") return Share2;
    if (type === "views") return Eye;
    if (type === "retweets") return Repeat2;
    return Heart;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getEngagementStats = (post: TrendingPost) => {
    const stats = [];
    const { engagement, platform } = post;

    if (engagement.views) {
      stats.push({ 
        icon: Eye, 
        value: engagement.views, 
        label: "views",
        color: "text-blue-400" 
      });
    }

    if (engagement.likes) {
      const Icon = getEngagementIcon(platform, "likes");
      stats.push({ 
        icon: Icon, 
        value: engagement.likes, 
        label: platform === "linkedin" ? "reactions" : "likes",
        color: "text-pink-400" 
      });
    }

    if (engagement.retweets) {
      stats.push({ 
        icon: Repeat2, 
        value: engagement.retweets, 
        label: "retweets",
        color: "text-green-400" 
      });
    }

    if (engagement.comments) {
      stats.push({ 
        icon: MessageCircle, 
        value: engagement.comments, 
        label: "comments",
        color: "text-purple-400" 
      });
    }

    if (engagement.shares && !engagement.retweets) {
      stats.push({ 
        icon: Share2, 
        value: engagement.shares, 
        label: "shares",
        color: "text-orange-400" 
      });
    }

    return stats;
  };

  if (sortedPosts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="mb-2 text-muted-foreground">No trending posts</h3>
        <p className="text-sm text-muted-foreground">
          No trending posts found for {selectedPlatform === "all" ? "any platform" : selectedPlatform}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl">Trending in Your Niche</h2>
        </div>
        <Badge variant="outline" className="gap-1">
          <TrendingUp className="w-3 h-3" />
          {sortedPosts.length} {sortedPosts.length === 1 ? "post" : "posts"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sortedPosts.map((post) => {
          const stats = getEngagementStats(post);
          
          return (
            <Card key={post.id} className="p-4 hover:border-primary/50 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={post.authorImage} alt={post.author} />
                    <AvatarFallback>{post.author[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate">{post.author}</p>
                      <PlatformIcon platform={post.platform} className="w-4 h-4 flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className="ml-2 flex-shrink-0 gap-1 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20"
                >
                  <TrendingUp className="w-3 h-3" />
                  {post.trendScore}
                </Badge>
              </div>

              {/* Content */}
              <div className="mb-3">
                <p className="text-sm line-clamp-3 mb-2">{post.content}</p>
                {post.image && (
                  <div className="rounded-lg overflow-hidden mt-2">
                    <ImageWithFallback
                      src={post.image}
                      alt="Post content"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Niche tag */}
              <Badge variant="secondary" className="mb-3 text-xs">
                {post.niche}
              </Badge>

              {/* Engagement Stats */}
              <div className="flex items-center gap-4 pt-3 border-t border-border">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-sm">{formatNumber(stat.value)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1">
                  View Post
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Analyze
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
