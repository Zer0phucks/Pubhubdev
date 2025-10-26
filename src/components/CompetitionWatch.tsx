import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import {
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Eye,
  ExternalLink,
  Trophy,
  Star,
  Sparkles,
  BarChart3,
  Activity,
  Target,
  AlertCircle,
  Filter
} from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface Competitor {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  avatar: string;
  followers: number;
  avgEngagement: number;
  growthRate: number;
  topContent: string;
  isRising: boolean;
  verified: boolean;
  niche: string;
  lastActive: string;
  contentFrequency: string;
}

interface CompetitionWatchProps {
  selectedPlatform: Platform;
}

// Mock data for competitors across different platforms
const mockCompetitors: Competitor[] = [
  // Twitter competitors
  {
    id: "1",
    name: "Sarah Tech",
    handle: "@sarahtech",
    platform: "twitter",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80",
    followers: 125000,
    avgEngagement: 4.8,
    growthRate: 12.5,
    topContent: "10 AI tools that will change your workflow",
    isRising: true,
    verified: true,
    niche: "AI & Technology",
    lastActive: "2 hours ago",
    contentFrequency: "3-5 posts/day"
  },
  {
    id: "2",
    name: "Mike Marketing",
    handle: "@mikemarketing",
    platform: "twitter",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80",
    followers: 89000,
    avgEngagement: 3.2,
    growthRate: 8.3,
    topContent: "The complete guide to content marketing in 2025",
    isRising: false,
    verified: true,
    niche: "Digital Marketing",
    lastActive: "5 hours ago",
    contentFrequency: "2-3 posts/day"
  },
  // Instagram competitors
  {
    id: "3",
    name: "Emily Creative",
    handle: "@emilycreative",
    platform: "instagram",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&q=80",
    followers: 245000,
    avgEngagement: 7.2,
    growthRate: 15.8,
    topContent: "Morning routine for creative minds",
    isRising: true,
    verified: true,
    niche: "Lifestyle & Design",
    lastActive: "1 hour ago",
    contentFrequency: "Daily posts + Stories"
  },
  {
    id: "4",
    name: "Design Hub",
    handle: "@designhub",
    platform: "instagram",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop&q=80",
    followers: 180000,
    avgEngagement: 5.5,
    growthRate: 10.2,
    topContent: "UI/UX trends that matter",
    isRising: false,
    verified: false,
    niche: "Design",
    lastActive: "3 hours ago",
    contentFrequency: "4-5 posts/week"
  },
  // LinkedIn competitors
  {
    id: "5",
    name: "Alex Business",
    handle: "alex-business",
    platform: "linkedin",
    avatar: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop&q=80",
    followers: 78000,
    avgEngagement: 2.8,
    growthRate: 6.5,
    topContent: "Leadership lessons from startup failures",
    isRising: false,
    verified: false,
    niche: "Business Strategy",
    lastActive: "1 day ago",
    contentFrequency: "2-3 posts/week"
  },
  {
    id: "6",
    name: "Rachel Leadership",
    handle: "rachel-leadership",
    platform: "linkedin",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80",
    followers: 92000,
    avgEngagement: 3.5,
    growthRate: 9.1,
    topContent: "Building high-performance teams remotely",
    isRising: true,
    verified: true,
    niche: "Leadership",
    lastActive: "6 hours ago",
    contentFrequency: "Daily articles"
  },
  // YouTube competitors
  {
    id: "7",
    name: "TechReviewer Pro",
    handle: "@techreviewerpro",
    platform: "youtube",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&q=80",
    followers: 520000,
    avgEngagement: 8.9,
    growthRate: 18.3,
    topContent: "iPhone 16 Pro Max - The Truth",
    isRising: true,
    verified: true,
    niche: "Tech Reviews",
    lastActive: "12 hours ago",
    contentFrequency: "2 videos/week"
  },
  {
    id: "8",
    name: "Learn With Lisa",
    handle: "@learnwithlisa",
    platform: "youtube",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80",
    followers: 340000,
    avgEngagement: 6.7,
    growthRate: 12.8,
    topContent: "Master React in 30 Days",
    isRising: false,
    verified: true,
    niche: "Education",
    lastActive: "2 days ago",
    contentFrequency: "Weekly tutorials"
  },
  // TikTok competitors
  {
    id: "9",
    name: "QuickTips Daily",
    handle: "@quicktipsdaily",
    platform: "tiktok",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&q=80",
    followers: 890000,
    avgEngagement: 12.4,
    growthRate: 28.5,
    topContent: "Life hacks you didn't know you needed",
    isRising: true,
    verified: true,
    niche: "Lifestyle",
    lastActive: "30 minutes ago",
    contentFrequency: "3-4 videos/day"
  },
  {
    id: "10",
    name: "Comedy Central",
    handle: "@comedycentral",
    platform: "tiktok",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&q=80",
    followers: 1200000,
    avgEngagement: 15.8,
    growthRate: 32.1,
    topContent: "When your code finally works",
    isRising: true,
    verified: true,
    niche: "Comedy",
    lastActive: "1 hour ago",
    contentFrequency: "Multiple daily"
  },
  // Facebook competitors
  {
    id: "11",
    name: "Community Connect",
    handle: "communityconnect",
    platform: "facebook",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&q=80",
    followers: 156000,
    avgEngagement: 3.9,
    growthRate: 5.2,
    topContent: "Building stronger local communities",
    isRising: false,
    verified: false,
    niche: "Community",
    lastActive: "4 hours ago",
    contentFrequency: "Daily updates"
  },
  // Pinterest competitors
  {
    id: "12",
    name: "DIY Dreams",
    handle: "@diydreams",
    platform: "pinterest",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&q=80",
    followers: 420000,
    avgEngagement: 9.2,
    growthRate: 14.7,
    topContent: "30 DIY home decor ideas",
    isRising: true,
    verified: true,
    niche: "DIY & Crafts",
    lastActive: "5 hours ago",
    contentFrequency: "10+ pins/day"
  },
  // Reddit competitors
  {
    id: "13",
    name: "TechInsights",
    handle: "u/techinsights",
    platform: "reddit",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80",
    followers: 67000,
    avgEngagement: 4.1,
    growthRate: 7.8,
    topContent: "Why this programming language is dying",
    isRising: false,
    verified: false,
    niche: "Technology",
    lastActive: "8 hours ago",
    contentFrequency: "Weekly posts"
  },
  // Blog competitors
  {
    id: "14",
    name: "The Content Lab",
    handle: "thecontentlab.com",
    platform: "blog",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop&q=80",
    followers: 45000,
    avgEngagement: 2.3,
    growthRate: 4.5,
    topContent: "SEO strategies that actually work in 2025",
    isRising: false,
    verified: false,
    niche: "Content Marketing",
    lastActive: "3 days ago",
    contentFrequency: "2-3 articles/week"
  }
];

export function CompetitionWatch({ selectedPlatform }: CompetitionWatchProps) {
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [filterNiche, setFilterNiche] = useState<string>("all");

  // Filter competitors based on selected platform
  const getFilteredCompetitors = () => {
    let filtered = selectedPlatform === "all"
      ? mockCompetitors
      : mockCompetitors.filter(c => c.platform === selectedPlatform);

    if (filterNiche !== "all") {
      filtered = filtered.filter(c => c.niche === filterNiche);
    }

    return filtered.sort((a, b) => b.followers - a.followers);
  };

  const filteredCompetitors = getFilteredCompetitors();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 10) return "text-green-500";
    if (rate >= 5) return "text-yellow-500";
    return "text-muted-foreground";
  };

  // Get unique niches for filtering
  const uniqueNiches = Array.from(new Set(mockCompetitors.map(c => c.niche)));

  // Calculate summary stats
  const avgFollowers = filteredCompetitors.reduce((sum, c) => sum + c.followers, 0) / filteredCompetitors.length || 0;
  const avgEngagement = filteredCompetitors.reduce((sum, c) => sum + c.avgEngagement, 0) / filteredCompetitors.length || 0;
  const topCompetitor = filteredCompetitors[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h1 className="text-emerald-400">Competition Watch</h1>
        </div>
        <p className="text-muted-foreground">
          Track and analyze top content creators in your niche across all platforms
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Competitors</p>
                <p className="text-2xl font-bold">{filteredCompetitors.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Followers</p>
                <p className="text-2xl font-bold">{formatNumber(avgFollowers)}</p>
              </div>
              <Activity className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Engagement</p>
                <p className="text-2xl font-bold">{avgEngagement.toFixed(1)}%</p>
              </div>
              <Heart className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rising Stars</p>
                <p className="text-2xl font-bold">{filteredCompetitors.filter(c => c.isRising).length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Competitor Highlight */}
      {topCompetitor && (
        <Card className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={topCompetitor.avatar} alt={topCompetitor.name} />
                    <AvatarFallback>{topCompetitor.name[0]}</AvatarFallback>
                  </Avatar>
                  <Trophy className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">👑 Top Competitor</h3>
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
                      #{1} in {selectedPlatform === "all" ? "All Platforms" : selectedPlatform}
                    </Badge>
                  </div>
                  <p className="text-lg">{topCompetitor.name}</p>
                  <p className="text-sm text-muted-foreground">{topCompetitor.handle} • {formatNumber(topCompetitor.followers)} followers</p>
                  <p className="text-sm mt-1">Latest: "{topCompetitor.topContent}"</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  Analyze
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterNiche}
              onChange={(e) => setFilterNiche(e.target.value)}
              className="bg-transparent border border-border rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Niches</option>
              {uniqueNiches.map(niche => (
                <option key={niche} value={niche}>{niche}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewType === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType("grid")}
          >
            Grid View
          </Button>
          <Button
            variant={viewType === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType("list")}
          >
            List View
          </Button>
        </div>
      </div>

      {/* Competitors Grid/List */}
      {filteredCompetitors.length === 0 ? (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            No competitors found for {selectedPlatform === "all" ? "any platform" : selectedPlatform}
            {filterNiche !== "all" && ` in ${filterNiche} niche`}.
          </AlertDescription>
        </Alert>
      ) : viewType === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompetitors.map((competitor, index) => (
            <Card key={competitor.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={competitor.avatar} alt={competitor.name} />
                        <AvatarFallback>{competitor.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                        <PlatformIcon platform={competitor.platform} className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{competitor.name}</p>
                        {competitor.verified && (
                          <Star className="w-3 h-3 text-blue-400 fill-blue-400" />
                        )}
                        {competitor.isRising && (
                          <Badge variant="secondary" className="h-5 px-1.5 bg-green-500/20 text-green-500">
                            <TrendingUp className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{competitor.handle}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Followers</span>
                    <span className="font-medium">{formatNumber(competitor.followers)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Engagement</span>
                    <span className={`font-medium ${getEngagementColor(competitor.avgEngagement)}`}>
                      {competitor.avgEngagement}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Growth</span>
                    <span className="font-medium text-purple-500">
                      +{competitor.growthRate}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Niche</span>
                    <Badge variant="secondary" className="text-xs">
                      {competitor.niche}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Top Content:</p>
                  <p className="text-sm line-clamp-2">"{competitor.topContent}"</p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{competitor.lastActive}</span>
                  <span>{competitor.contentFrequency}</span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-3 h-3 mr-1" />
                    Analyze
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCompetitors.map((competitor, index) => (
            <Card key={competitor.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={competitor.avatar} alt={competitor.name} />
                        <AvatarFallback>{competitor.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                        <PlatformIcon platform={competitor.platform} className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{competitor.name}</p>
                        {competitor.verified && (
                          <Star className="w-3 h-3 text-blue-400 fill-blue-400" />
                        )}
                        {competitor.isRising && (
                          <Badge variant="secondary" className="h-5 px-1.5 bg-green-500/20 text-green-500">
                            Rising
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{competitor.handle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-medium">{formatNumber(competitor.followers)}</p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className={`font-medium ${getEngagementColor(competitor.avgEngagement)}`}>
                        {competitor.avgEngagement}%
                      </p>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-purple-500">+{competitor.growthRate}%</p>
                      <p className="text-xs text-muted-foreground">Growth</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-3 h-3 mr-1" />
                      Analyze
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}