import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { PlatformIcon } from "./PlatformIcon";
import { 
  TrendingUp, 
  Clock,
  Users,
  Heart,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Sparkles
} from "lucide-react";

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface InsightCard {
  title: string;
  value: string;
  change: number;
  trend: "up" | "down";
}

interface CombinedInsightsProps {
  selectedPlatform: Platform;
}

export function CombinedInsights({ selectedPlatform }: CombinedInsightsProps) {

  const platformNames: Record<Platform, string> = {
    all: "ALL",
    twitter: "Twitter",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    youtube: "YouTube",
    tiktok: "TikTok",
    pinterest: "Pinterest",
    reddit: "Reddit",
    blog: "Blog"
  };

  // Content Insights Data
  const contentInsights: Record<Platform, InsightCard[]> = {
    all: [
      { title: "Best Performing Type", value: "Video Content", change: 22, trend: "up" },
      { title: "Avg. Engagement Rate", value: "6.5%", change: 14, trend: "up" },
      { title: "Overall Reach", value: "2.4M", change: 18, trend: "up" },
      { title: "Top Content Theme", value: "Educational", change: 20, trend: "up" }
    ],
    twitter: [
      { title: "Best Performing Type", value: "Threads", change: 12, trend: "up" },
      { title: "Avg. Engagement Rate", value: "4.2%", change: 8, trend: "up" },
      { title: "Optimal Post Length", value: "280 chars", change: 0, trend: "up" },
      { title: "Top Content Theme", value: "Tech Tips", change: 15, trend: "up" }
    ],
    instagram: [
      { title: "Best Performing Type", value: "Reels", change: 25, trend: "up" },
      { title: "Avg. Engagement Rate", value: "6.8%", change: 12, trend: "up" },
      { title: "Optimal Format", value: "Carousel", change: 10, trend: "up" },
      { title: "Top Content Theme", value: "Lifestyle", change: 18, trend: "up" }
    ],
    linkedin: [
      { title: "Best Performing Type", value: "Articles", change: 20, trend: "up" },
      { title: "Avg. Engagement Rate", value: "3.5%", change: 5, trend: "up" },
      { title: "Optimal Post Length", value: "1200 words", change: 0, trend: "up" },
      { title: "Top Content Theme", value: "Industry News", change: 22, trend: "up" }
    ],
    facebook: [
      { title: "Best Performing Type", value: "Video", change: 15, trend: "up" },
      { title: "Avg. Engagement Rate", value: "5.1%", change: 7, trend: "up" },
      { title: "Optimal Format", value: "Native Video", change: 12, trend: "up" },
      { title: "Top Content Theme", value: "Community", change: 14, trend: "up" }
    ],
    youtube: [
      { title: "Best Performing Type", value: "Tutorials", change: 30, trend: "up" },
      { title: "Avg. Engagement Rate", value: "8.9%", change: 20, trend: "up" },
      { title: "Optimal Length", value: "12 minutes", change: 0, trend: "up" },
      { title: "Top Content Theme", value: "How-To", change: 25, trend: "up" }
    ],
    tiktok: [
      { title: "Best Performing Type", value: "Short Clips", change: 50, trend: "up" },
      { title: "Avg. Engagement Rate", value: "12.5%", change: 35, trend: "up" },
      { title: "Optimal Length", value: "15-30 sec", change: 0, trend: "up" },
      { title: "Top Content Theme", value: "Trends", change: 40, trend: "up" }
    ],
    pinterest: [
      { title: "Best Performing Type", value: "Infographics", change: 28, trend: "up" },
      { title: "Avg. Engagement Rate", value: "5.6%", change: 15, trend: "up" },
      { title: "Optimal Format", value: "Vertical", change: 0, trend: "up" },
      { title: "Top Content Theme", value: "DIY & Crafts", change: 22, trend: "up" }
    ],
    reddit: [
      { title: "Best Performing Type", value: "Discussions", change: 18, trend: "up" },
      { title: "Avg. Engagement Rate", value: "7.2%", change: 10, trend: "up" },
      { title: "Optimal Post Type", value: "Text Posts", change: 0, trend: "up" },
      { title: "Top Content Theme", value: "Q&A", change: 16, trend: "up" }
    ],
    blog: [
      { title: "Best Performing Type", value: "Long-Form", change: 32, trend: "up" },
      { title: "Avg. Reading Time", value: "8 min", change: 12, trend: "up" },
      { title: "Optimal Length", value: "2000+ words", change: 0, trend: "up" },
      { title: "Top Content Theme", value: "Tutorials", change: 28, trend: "up" }
    ]
  };

  // Schedule Insights Data
  const scheduleInsights: Record<Platform, { bestTimes: string[], bestDays: string[], peakEngagement: string }> = {
    all: {
      bestTimes: ["9:00 AM", "1:00 PM", "7:00 PM"],
      bestDays: ["Tuesday", "Wednesday", "Friday"],
      peakEngagement: "Wednesday at 1:00 PM"
    },
    twitter: {
      bestTimes: ["9:00 AM", "12:00 PM", "5:00 PM"],
      bestDays: ["Tuesday", "Wednesday", "Thursday"],
      peakEngagement: "Wednesday at 12:00 PM"
    },
    instagram: {
      bestTimes: ["11:00 AM", "2:00 PM", "7:00 PM"],
      bestDays: ["Monday", "Wednesday", "Friday"],
      peakEngagement: "Friday at 7:00 PM"
    },
    linkedin: {
      bestTimes: ["8:00 AM", "12:00 PM", "5:00 PM"],
      bestDays: ["Tuesday", "Wednesday", "Thursday"],
      peakEngagement: "Tuesday at 8:00 AM"
    },
    facebook: {
      bestTimes: ["1:00 PM", "3:00 PM", "8:00 PM"],
      bestDays: ["Wednesday", "Thursday", "Sunday"],
      peakEngagement: "Sunday at 8:00 PM"
    },
    youtube: {
      bestTimes: ["2:00 PM", "6:00 PM", "9:00 PM"],
      bestDays: ["Friday", "Saturday", "Sunday"],
      peakEngagement: "Saturday at 6:00 PM"
    },
    tiktok: {
      bestTimes: ["7:00 AM", "4:00 PM", "9:00 PM"],
      bestDays: ["Tuesday", "Thursday", "Friday"],
      peakEngagement: "Friday at 9:00 PM"
    },
    pinterest: {
      bestTimes: ["8:00 PM", "9:00 PM", "11:00 PM"],
      bestDays: ["Saturday", "Sunday", "Monday"],
      peakEngagement: "Saturday at 9:00 PM"
    },
    reddit: {
      bestTimes: ["6:00 AM", "12:00 PM", "9:00 PM"],
      bestDays: ["Monday", "Tuesday", "Wednesday"],
      peakEngagement: "Monday at 9:00 PM"
    },
    blog: {
      bestTimes: ["7:00 AM", "1:00 PM", "8:00 PM"],
      bestDays: ["Tuesday", "Wednesday", "Thursday"],
      peakEngagement: "Tuesday at 7:00 AM"
    }
  };

  // Hashtag Insights Data
  const hashtagInsights: Record<Platform, { trending: string[], recommended: string[], topPerforming: string[] }> = {
    all: {
      trending: ["#ContentCreation", "#DigitalMarketing", "#SocialMedia", "#CreatorEconomy", "#Innovation"],
      recommended: ["#ContentStrategy", "#GrowthHacking", "#Engagement", "#CreatorLife", "#BuildInPublic"],
      topPerforming: ["#Tutorial", "#Tips", "#HowTo", "#BehindTheScenes", "#DailyPost"]
    },
    twitter: {
      trending: ["#AI", "#Tech", "#Innovation", "#Startup", "#Future"],
      recommended: ["#ContentCreator", "#DigitalMarketing", "#SocialMedia", "#Growth", "#Engagement"],
      topPerforming: ["#TechTips", "#CodeNewbie", "#WebDev", "#Programming", "#BuildInPublic"]
    },
    instagram: {
      trending: ["#InstaDaily", "#PhotoOfTheDay", "#InstaGood", "#Love", "#Instagood"],
      recommended: ["#CreatorLife", "#ContentStrategy", "#IGReels", "#InstaGrowth", "#Influencer"],
      topPerforming: ["#LifestyleBlogger", "#TravelGram", "#FitnessMotivation", "#Foodie", "#OOTD"]
    },
    linkedin: {
      trending: ["#LinkedInTips", "#CareerGrowth", "#Leadership", "#Innovation", "#FutureOfWork"],
      recommended: ["#ProfessionalDevelopment", "#B2B", "#Marketing", "#Sales", "#Networking"],
      topPerforming: ["#ThoughtLeadership", "#IndustryInsights", "#BusinessStrategy", "#CareerAdvice", "#Hiring"]
    },
    facebook: {
      trending: ["#Motivation", "#Family", "#Community", "#Life", "#Blessed"],
      recommended: ["#SmallBusiness", "#LocalBusiness", "#Support", "#Shopping", "#Community"],
      topPerforming: ["#MondayMotivation", "#ThrowbackThursday", "#FridayFeeling", "#WeekendVibes", "#SundayFunday"]
    },
    youtube: {
      trending: ["#Shorts", "#Tutorial", "#HowTo", "#Review", "#Vlog"],
      recommended: ["#YouTuber", "#Subscribe", "#ContentCreator", "#NewVideo", "#Trending"],
      topPerforming: ["#TechReview", "#Gaming", "#DIY", "#Cooking", "#Fitness"]
    },
    tiktok: {
      trending: ["#FYP", "#ForYou", "#Viral", "#Trending", "#Challenge"],
      recommended: ["#TikTokMadeMeBuyIt", "#LearnOnTikTok", "#TikTokTutorial", "#LifeHack", "#DuetThis"],
      topPerforming: ["#Dance", "#Comedy", "#DIY", "#Recipe", "#MakeupTutorial"]
    },
    pinterest: {
      trending: ["#PinterestInspired", "#DIYProjects", "#HomeDecor", "#Recipe", "#Fashion"],
      recommended: ["#PinterestTips", "#InspirationalQuotes", "#DIYIdeas", "#WeddingIdeas", "#Crafts"],
      topPerforming: ["#InteriorDesign", "#GardenIdeas", "#HealthyRecipes", "#BeautyTips", "#OutfitIdeas"]
    },
    reddit: {
      trending: ["r/AskReddit", "r/todayilearned", "r/explainlikeimfive", "r/news", "r/technology"],
      recommended: ["r/entrepreneur", "r/smallbusiness", "r/marketing", "r/socialmedia", "r/content"],
      topPerforming: ["r/IAmA", "r/LifeProTips", "r/Showerthoughts", "r/Futurology", "r/dataisbeautiful"]
    },
    blog: {
      trending: ["#Blogging", "#ContentCreation", "#Writing", "#SEO", "#WordPress"],
      recommended: ["#BloggingTips", "#ContentMarketing", "#Blogger", "#WritingCommunity", "#BlogPost"],
      topPerforming: ["#Tutorial", "#HowTo", "#Guide", "#TechBlog", "#DigitalMarketing"]
    }
  };

  // Trending Insights Data
  const trendingInsights: Record<Platform, { topics: Array<{ name: string; growth: number }>, competitors: string[], opportunities: string[] }> = {
    all: {
      topics: [
        { name: "AI & Technology", growth: 58 },
        { name: "Video Content", growth: 52 },
        { name: "Sustainability", growth: 45 },
        { name: "Creator Economy", growth: 40 }
      ],
      competitors: ["Top Creator Network", "Multi-Platform Influencer", "Content Pro"],
      opportunities: ["Cross-platform campaigns", "Video-first strategy", "Community engagement across channels"]
    },
    twitter: {
      topics: [
        { name: "AI & Machine Learning", growth: 45 },
        { name: "Climate Tech", growth: 38 },
        { name: "Web3 & Crypto", growth: 25 },
        { name: "Remote Work", growth: 20 }
      ],
      competitors: ["@TechInfluencer", "@CodeMaster", "@DevCommunity"],
      opportunities: ["Live Spaces about AI", "Twitter Threads on Tech News", "Poll-based engagement"]
    },
    instagram: {
      topics: [
        { name: "Sustainability", growth: 52 },
        { name: "Wellness", growth: 41 },
        { name: "Home Decor", growth: 35 },
        { name: "Food Photography", growth: 28 }
      ],
      competitors: ["@lifestyle_guru", "@wellness_daily", "@home_inspo"],
      opportunities: ["Reels with trending audio", "Carousel posts with tips", "Story polls and quizzes"]
    },
    linkedin: {
      topics: [
        { name: "Remote Work Culture", growth: 48 },
        { name: "AI in Business", growth: 55 },
        { name: "Leadership Development", growth: 32 },
        { name: "DEI Initiatives", growth: 30 }
      ],
      competitors: ["Industry Leader Co.", "Thought Leader Inc.", "Business Insights"],
      opportunities: ["Long-form articles", "Video insights", "Document carousels"]
    },
    facebook: {
      topics: [
        { name: "Community Events", growth: 35 },
        { name: "Local Business Support", growth: 42 },
        { name: "Family Activities", growth: 28 },
        { name: "DIY Projects", growth: 25 }
      ],
      competitors: ["Community Hub", "Local Connect", "Family First"],
      opportunities: ["Live videos", "Group discussions", "Event promotion"]
    },
    youtube: {
      topics: [
        { name: "Short Form Content", growth: 65 },
        { name: "Educational Tech", growth: 58 },
        { name: "Product Reviews", growth: 45 },
        { name: "Gaming Walkthroughs", growth: 40 }
      ],
      competitors: ["TechReviewer", "Tutorial Master", "How-To Channel"],
      opportunities: ["YouTube Shorts", "Series content", "Collaboration videos"]
    },
    tiktok: {
      topics: [
        { name: "Dance Challenges", growth: 75 },
        { name: "Cooking Hacks", growth: 62 },
        { name: "Comedy Skits", growth: 58 },
        { name: "Life Hacks", growth: 54 }
      ],
      competitors: ["@trendsetter", "@viral_creator", "@tiktoker_pro"],
      opportunities: ["Duet with trending creators", "Use trending sounds", "Jump on challenges early"]
    },
    pinterest: {
      topics: [
        { name: "Sustainable Living", growth: 68 },
        { name: "Budget Decorating", growth: 55 },
        { name: "Meal Prep Ideas", growth: 50 },
        { name: "Minimalist Design", growth: 45 }
      ],
      competitors: ["Design Inspiration Hub", "DIY Queen", "Home Style Pro"],
      opportunities: ["Create idea pins", "Rich pins for products", "Seasonal content boards"]
    },
    reddit: {
      topics: [
        { name: "Tech Discussions", growth: 42 },
        { name: "Career Advice", growth: 38 },
        { name: "Personal Finance", growth: 35 },
        { name: "Mental Health", growth: 32 }
      ],
      competitors: ["u/IndustryExpert", "u/LifeProTips", "u/TechGuru"],
      opportunities: ["Host AMAs", "Share expertise in niche subreddits", "Create valuable discussions"]
    },
    blog: {
      topics: [
        { name: "AI & Technology", growth: 72 },
        { name: "Productivity Tips", growth: 58 },
        { name: "Web Development", growth: 52 },
        { name: "Digital Marketing", growth: 48 }
      ],
      competitors: ["TechCrunch", "Medium Writers", "Dev.to Authors"],
      opportunities: ["Guest posting", "SEO optimization", "Newsletter integration", "Series content"]
    }
  };

  return (
    <div className="space-y-8">
      {/* Platform Header - only show for specific platforms */}
      {selectedPlatform !== "all" && (
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <PlatformIcon platform={selectedPlatform} className="w-8 h-8" size={32} />
          <div>
            <h2>{platformNames[selectedPlatform]} Insights</h2>
            <p className="text-sm text-muted-foreground">Analytics and recommendations for {platformNames[selectedPlatform]}</p>
          </div>
        </div>
      )}

      {/* Content Insights Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3>Content Performance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {contentInsights[selectedPlatform].map((insight, index) => (
            <Card key={index} className="p-6 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-muted-foreground">{insight.title}</p>
                <Badge className={insight.trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                  {insight.trend === "up" ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                  {insight.change}%
                </Badge>
              </div>
              <h3 className="text-purple-400">{insight.value}</h3>
            </Card>
          ))}
        </div>
        
        <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h4>AI Recommendations</h4>
          </div>
          <div className="space-y-3">
            <p className="text-muted-foreground">
              • Based on your {platformNames[selectedPlatform]} analytics, carousel posts get 3x more engagement than single images.
            </p>
            <p className="text-muted-foreground">
              • Your audience responds best to educational content. Consider creating more how-to posts.
            </p>
            <p className="text-muted-foreground">
              • Posts with questions in the caption receive 45% more comments. Try ending with a call-to-action question.
            </p>
          </div>
        </Card>
      </div>

      {/* Schedule Insights Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3>Optimal Posting Times</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-400" />
              <h4>Best Times to Post</h4>
            </div>
            <div className="space-y-2">
              {scheduleInsights[selectedPlatform].bestTimes.map((time, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-blue-500/5 rounded">
                  <span className="text-blue-400">{time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-pink-400" />
              <h4>Best Days to Post</h4>
            </div>
            <div className="space-y-2">
              {scheduleInsights[selectedPlatform].bestDays.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-pink-500/5 rounded">
                  <span className="text-pink-400">{day}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h4>Peak Engagement</h4>
            </div>
            <div className="flex items-center justify-center h-24">
              <p className="text-center text-amber-400">
                {scheduleInsights[selectedPlatform].peakEngagement}
              </p>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h4>Posting Schedule Recommendations</h4>
          </div>
          <div className="space-y-3">
            <p className="text-muted-foreground">
              • Posting consistently at {scheduleInsights[selectedPlatform].bestTimes[0]} increases reach by 30%.
            </p>
            <p className="text-muted-foreground">
              • Your {platformNames[selectedPlatform]} audience is most active on {scheduleInsights[selectedPlatform].bestDays[0]}s.
            </p>
            <p className="text-muted-foreground">
              • Consider scheduling 3-5 posts per week for optimal engagement without overwhelming your audience.
            </p>
          </div>
        </Card>
      </div>

      {/* Hashtag Insights Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-orange-400" />
          <h3>Hashtag Strategy</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <h4>Trending Now</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtagInsights[selectedPlatform].trending.map((tag, index) => (
                <Badge key={index} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 cursor-pointer">
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h4>Recommended for You</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtagInsights[selectedPlatform].recommended.map((tag, index) => (
                <Badge key={index} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer">
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-purple-400" />
              <h4>Top Performing</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtagInsights[selectedPlatform].topPerforming.map((tag, index) => (
                <Badge key={index} className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 cursor-pointer">
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h4>Hashtag Strategy Tips</h4>
          </div>
          <div className="space-y-3">
            <p className="text-muted-foreground">
              • Use 3-5 relevant hashtags per post on {platformNames[selectedPlatform]} for optimal reach.
            </p>
            <p className="text-muted-foreground">
              • Mix trending hashtags with niche-specific ones to reach both broad and targeted audiences.
            </p>
            <p className="text-muted-foreground">
              • Your top-performing hashtag {hashtagInsights[selectedPlatform].topPerforming[0]} increases engagement by 40%.
            </p>
          </div>
        </Card>
      </div>

      {/* Trending Topics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h3>Trending Topics & Opportunities</h3>
        </div>
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h4>Trending Topics in Your Niche</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendingInsights[selectedPlatform].topics.map((topic, index) => (
              <div key={index} className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/10">
                <div className="flex items-center justify-between mb-2">
                  <h4>{topic.name}</h4>
                  <Badge className="bg-green-500/10 text-green-500">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    {topic.growth}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-pink-400" />
              <h4>Competitors to Watch</h4>
            </div>
            <div className="space-y-2">
              {trendingInsights[selectedPlatform].competitors.map((competitor, index) => (
                <div key={index} className="p-3 bg-pink-500/5 rounded flex items-center justify-between">
                  <span>{competitor}</span>
                  <Button variant="ghost" size="sm" className="text-pink-400 hover:text-pink-300">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h4>Content Opportunities</h4>
            </div>
            <div className="space-y-2">
              {trendingInsights[selectedPlatform].opportunities.map((opportunity, index) => (
                <div key={index} className="p-3 bg-emerald-500/5 rounded flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">{opportunity}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h4>Trending Insights</h4>
          </div>
          <div className="space-y-3">
            <p className="text-muted-foreground">
              • {trendingInsights[selectedPlatform].topics[0].name} is seeing explosive growth on {platformNames[selectedPlatform]}.
            </p>
            <p className="text-muted-foreground">
              • Your competitors are posting 2x more frequently. Consider increasing your posting schedule.
            </p>
            <p className="text-muted-foreground">
              • Capitalize on trending topics early for maximum reach - posts made within the first 24 hours get 5x more engagement.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}