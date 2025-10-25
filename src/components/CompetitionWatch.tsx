import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Eye,
  ChevronRight,
  Trophy,
  Star,
  Sparkles
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
}

interface CompetitionWatchProps {
  selectedPlatform: Platform;
  onViewCompetitor?: (competitor: Competitor) => void;
}

// Mock data for competitors across different platforms
const mockCompetitors: Competitor[] = [
  // Twitter competitors
  {
    id: "1",
    name: "Sarah Tech",
    handle: "@sarahtech",
    platform: "twitter",
    avatar: "https://avatar.vercel.sh/sarahtech",
    followers: 125000,
    avgEngagement: 4.8,
    growthRate: 12.5,
    topContent: "10 AI tools that will change your workflow",
    isRising: true,
    verified: true,
    niche: "AI & Technology"
  },
  {
    id: "2",
    name: "Mike Marketing",
    handle: "@mikemarketing",
    platform: "twitter",
    avatar: "https://avatar.vercel.sh/mikemarketing",
    followers: 89000,
    avgEngagement: 3.2,
    growthRate: 8.3,
    topContent: "The complete guide to content marketing in 2025",
    isRising: false,
    verified: true,
    niche: "Digital Marketing"
  },
  // Instagram competitors
  {
    id: "3",
    name: "Emily Creative",
    handle: "@emilycreative",
    platform: "instagram",
    avatar: "https://avatar.vercel.sh/emilycreative",
    followers: 245000,
    avgEngagement: 7.2,
    growthRate: 15.8,
    topContent: "Morning routine for creative minds",
    isRising: true,
    verified: true,
    niche: "Lifestyle & Design"
  },
  {
    id: "4",
    name: "Design Hub",
    handle: "@designhub",
    platform: "instagram",
    avatar: "https://avatar.vercel.sh/designhub",
    followers: 180000,
    avgEngagement: 5.5,
    growthRate: 10.2,
    topContent: "UI/UX trends that matter",
    isRising: false,
    verified: false,
    niche: "Design"
  },
  // LinkedIn competitors
  {
    id: "5",
    name: "Alex Business",
    handle: "alex-business",
    platform: "linkedin",
    avatar: "https://avatar.vercel.sh/alexbusiness",
    followers: 78000,
    avgEngagement: 2.8,
    growthRate: 6.5,
    topContent: "Leadership lessons from startup failures",
    isRising: false,
    verified: false,
    niche: "Business Strategy"
  },
  {
    id: "6",
    name: "Rachel Leadership",
    handle: "rachel-leadership",
    platform: "linkedin",
    avatar: "https://avatar.vercel.sh/rachelleadership",
    followers: 92000,
    avgEngagement: 3.5,
    growthRate: 9.1,
    topContent: "Building high-performance teams remotely",
    isRising: true,
    verified: true,
    niche: "Leadership"
  },
  // YouTube competitors
  {
    id: "7",
    name: "TechReviewer Pro",
    handle: "@techreviewerpro",
    platform: "youtube",
    avatar: "https://avatar.vercel.sh/techreviewerpro",
    followers: 520000,
    avgEngagement: 8.9,
    growthRate: 18.3,
    topContent: "iPhone 16 Pro Max - The Truth",
    isRising: true,
    verified: true,
    niche: "Tech Reviews"
  },
  {
    id: "8",
    name: "Learn With Lisa",
    handle: "@learnwithlisa",
    platform: "youtube",
    avatar: "https://avatar.vercel.sh/learnwithlisa",
    followers: 340000,
    avgEngagement: 6.7,
    growthRate: 12.8,
    topContent: "Master React in 30 Days",
    isRising: false,
    verified: true,
    niche: "Education"
  },
  // TikTok competitors
  {
    id: "9",
    name: "QuickTips Daily",
    handle: "@quicktipsdaily",
    platform: "tiktok",
    avatar: "https://avatar.vercel.sh/quicktipsdaily",
    followers: 890000,
    avgEngagement: 12.4,
    growthRate: 28.5,
    topContent: "Life hacks you didn't know you needed",
    isRising: true,
    verified: true,
    niche: "Lifestyle"
  },
  {
    id: "10",
    name: "Comedy Central",
    handle: "@comedycentral",
    platform: "tiktok",
    avatar: "https://avatar.vercel.sh/comedycentral",
    followers: 1200000,
    avgEngagement: 15.8,
    growthRate: 32.1,
    topContent: "When your code finally works",
    isRising: true,
    verified: true,
    niche: "Comedy"
  },
  // Facebook competitors
  {
    id: "11",
    name: "Community Connect",
    handle: "communityconnect",
    platform: "facebook",
    avatar: "https://avatar.vercel.sh/communityconnect",
    followers: 156000,
    avgEngagement: 3.9,
    growthRate: 5.2,
    topContent: "Building stronger local communities",
    isRising: false,
    verified: false,
    niche: "Community"
  },
  // Pinterest competitors
  {
    id: "12",
    name: "DIY Dreams",
    handle: "@diydreams",
    platform: "pinterest",
    avatar: "https://avatar.vercel.sh/diydreams",
    followers: 420000,
    avgEngagement: 9.2,
    growthRate: 14.7,
    topContent: "30 DIY home decor ideas",
    isRising: true,
    verified: true,
    niche: "DIY & Crafts"
  },
  // Reddit competitors
  {
    id: "13",
    name: "TechInsights",
    handle: "u/techinsights",
    platform: "reddit",
    avatar: "https://avatar.vercel.sh/techinsights",
    followers: 67000,
    avgEngagement: 4.1,
    growthRate: 7.8,
    topContent: "Why this programming language is dying",
    isRising: false,
    verified: false,
    niche: "Technology"
  },
  // Blog competitors
  {
    id: "14",
    name: "The Content Lab",
    handle: "thecontentlab.com",
    platform: "blog",
    avatar: "https://avatar.vercel.sh/thecontentlab",
    followers: 45000,
    avgEngagement: 2.3,
    growthRate: 4.5,
    topContent: "SEO strategies that actually work in 2025",
    isRising: false,
    verified: false,
    niche: "Content Marketing"
  }
];

export function CompetitionWatch({ selectedPlatform, onViewCompetitor }: CompetitionWatchProps) {
  const [expandedView, setExpandedView] = useState(false);

  // Filter competitors based on selected platform
  const getFilteredCompetitors = () => {
    if (selectedPlatform === "all") {
      // Show top 1 from each platform
      const platforms: Platform[] = ["twitter", "instagram", "linkedin", "facebook", "youtube", "tiktok", "pinterest", "reddit", "blog"];
      return platforms.map(platform =>
        mockCompetitors
          .filter(c => c.platform === platform)
          .sort((a, b) => b.followers - a.followers)[0]
      ).filter(Boolean);
    } else {
      // Show top 5 from selected platform
      return mockCompetitors
        .filter(c => c.platform === selectedPlatform)
        .sort((a, b) => b.followers - a.followers)
        .slice(0, 5);
    }
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h3 className="font-semibold text-sm">Competition Watch</h3>
        </div>
        {!expandedView && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setExpandedView(true)}
          >
            View All
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      <ScrollArea className={expandedView ? "h-[400px]" : "h-[280px]"}>
        <div className="space-y-2 px-3">
          {filteredCompetitors.map((competitor) => (
            <Card
              key={competitor.id}
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onViewCompetitor?.(competitor)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={competitor.avatar} alt={competitor.name} />
                    <AvatarFallback>{competitor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                    <PlatformIcon platform={competitor.platform} className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-medium text-sm truncate">{competitor.name}</p>
                        {competitor.verified && (
                          <Badge variant="secondary" className="h-4 px-1">
                            <Star className="w-2.5 h-2.5" />
                          </Badge>
                        )}
                        {competitor.isRising && (
                          <Badge variant="secondary" className="h-4 px-1 bg-green-500/10 text-green-500">
                            <TrendingUp className="w-2.5 h-2.5" />
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{competitor.handle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">{formatNumber(competitor.followers)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className={`w-3 h-3 ${getEngagementColor(competitor.avgEngagement)}`} />
                      <span className={`text-xs ${getEngagementColor(competitor.avgEngagement)}`}>
                        {competitor.avgEngagement}%
                      </span>
                    </div>
                    {competitor.growthRate > 10 && (
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-purple-500">+{competitor.growthRate}%</span>
                      </div>
                    )}
                  </div>

                  {expandedView && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Top content:</p>
                      <p className="text-xs line-clamp-1 mt-0.5">"{competitor.topContent}"</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {expandedView && (
        <div className="px-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={() => setExpandedView(false)}
          >
            Collapse
          </Button>
        </div>
      )}
    </div>
  );
}