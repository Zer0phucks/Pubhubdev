import { Card } from "./ui/card";
import { PlatformIcon } from "./PlatformIcon";
import { Badge } from "./ui/badge";
import { TrendingUp, Heart, MessageCircle, Share2, Eye, ThumbsUp, Repeat2, RefreshCw, AlertCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useTrendingPosts } from "../hooks/useTrendingPosts";
import { useProject } from "./ProjectContext";
import type { PlatformFilter } from "../types";

interface TrendingPostsProps {
  selectedPlatform: PlatformFilter;
}

export function TrendingPosts({ selectedPlatform }: TrendingPostsProps) {
  // Get current project ID
  const { currentProject } = useProject();

  // Fetch trending posts with SWR caching
  const {
    posts,
    isLoading,
    error,
    refresh,
    cached_at,
    next_refresh,
    totalCount,
  } = useTrendingPosts(currentProject?.id || '', {
    platform: selectedPlatform,
    category: 'general', // TODO: Make configurable based on project niche
    count: 20,
    enabled: !!currentProject?.id, // Only fetch if project exists
  });

  // Map API response to component format
  const trendingPosts = posts.map(post => ({
    id: post.id,
    platform: post.platform,
    author: post.author.username,
    authorImage: post.author.avatar || '',
    content: post.content,
    image: post.image,
    engagement: post.engagement,
    timestamp: new Date(post.created_at).toLocaleString(),
    niche: post.niche || 'general',
    trendScore: post.trending_score,
  }));

  const filteredPosts = selectedPlatform === "all"
    ? trendingPosts
    : trendingPosts.filter(post => post.platform === selectedPlatform);

  // Sort by trend score
  const sortedPosts = [...filteredPosts].sort((a, b) => b.trendScore - a.trendScore);

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500 animate-pulse" />
              <h2 className="text-xl">Loading Trending Posts...</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                  </div>
                  <div className="h-32 bg-muted rounded" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error && !sortedPosts.length) {
    return (
      <Card className="p-8 text-center border-destructive/50 bg-destructive/5">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
        <h3 className="mb-2 text-lg font-semibold">Failed to load trending posts</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || 'An error occurred while fetching trending content'}
        </p>
        <Button onClick={refresh} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </Card>
    );
  }

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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            className="gap-2"
            title="Refresh trending posts"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            {sortedPosts.length} {sortedPosts.length === 1 ? "post" : "posts"}
          </Badge>
        </div>
      </div>

      {/* Cache info */}
      {cached_at && (
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(cached_at).toLocaleString()}
          {next_refresh && ` • Next refresh: ${new Date(next_refresh).toLocaleTimeString()}`}
        </p>
      )}

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
