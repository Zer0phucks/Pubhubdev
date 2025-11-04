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

// Competitors data - to be populated from API
const mockCompetitors: Competitor[] = [];

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