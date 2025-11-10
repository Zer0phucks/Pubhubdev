import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Card } from "./ui/card";
import { TrendingUp, Users, Heart, MessageSquare, Calendar, Zap, Workflow, Settings, Loader2, RefreshCw, Link2, Video } from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";
import { getAutomationRules, getTransformationLabel } from "../utils/automationRules";
import { postsAPI, connectionsAPI } from "../utils/api";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useProject } from "./ProjectContext";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { logger } from '../utils/logger';

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  isPositive: boolean;
}

const StatCard = memo(function StatCard({ title, value, change, icon, isPositive }: StatCardProps) {
  const gradientClasses = [
    "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
    "from-pink-500/10 to-rose-500/10 border-pink-500/20",
    "from-purple-500/10 to-indigo-500/10 border-purple-500/20",
    "from-emerald-500/10 to-teal-500/10 border-emerald-500/20"
  ];
  const iconGradients = [
    "from-blue-500 to-cyan-500",
    "from-pink-500 to-rose-500",
    "from-purple-500 to-indigo-500",
    "from-emerald-500 to-teal-500"
  ];
  
  const index = title === "Total Reach" ? 0 : title === "Engagement" ? 1 : title === "New Messages" ? 2 : 3;
  
  return (
    <Card className={`p-6 bg-gradient-to-br ${gradientClasses[index]} border backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground">{title}</p>
          <h3 className="mt-2">{value}</h3>
          <p className={`mt-2 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {change}
          </p>
        </div>
        <div className={`p-3 bg-gradient-to-br ${iconGradients[index]} rounded-lg shadow-lg`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
});

interface DashboardOverviewProps {
  selectedPlatform: Platform;
  onNavigate?: (view: "compose" | "calendar") => void;
  onOpenAIChat?: (query?: string, autoSubmit?: boolean) => void;
}

export const DashboardOverview = memo(function DashboardOverview({ selectedPlatform, onNavigate, onOpenAIChat }: DashboardOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [postsData, setPostsData] = useState<BackendPost[]>([]);
  const [connectionsData, setConnectionsData] = useState<ConnectionPayload[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { currentProject } = useProject();

  useEffect(() => {
    if (currentProject) {
      loadDashboardData();
    }
  }, [currentProject?.id]);

  const loadDashboardData = useCallback(async () => {
    if (!currentProject) return;
    
    try {
      setLoading(true);
      const [postsResponse, connectionsResponse] = await Promise.all([
        postsAPI.getAll({ projectId: currentProject.id }),
        connectionsAPI.getAll(currentProject.id),
      ]);
      
      setPostsData(postsResponse.posts || []);
      setConnectionsData(connectionsResponse.connections || []);
    } catch (error) {
      logger.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
      toast.success('Dashboard refreshed');
    } catch (error) {
      logger.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboardData]);

  // Calculate real stats from backend data (memoized)
  const stats = useMemo(() => {
    const filteredPosts = selectedPlatform === 'all' 
      ? postsData 
      : postsData.filter(post => post.platforms?.includes(selectedPlatform));

    const totalPosts = filteredPosts.length;
    const publishedPosts = filteredPosts.filter(p => p.status === 'published').length;
    const scheduledPosts = filteredPosts.filter(p => p.status === 'scheduled').length;
    const draftPosts = filteredPosts.filter(p => p.status === 'draft').length;

    // Calculate posts in next 7 days
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingPosts = filteredPosts.filter(post => {
      if (!post.scheduledFor) return false;
      const scheduledDate = new Date(post.scheduledFor);
      return scheduledDate >= now && scheduledDate <= next7Days;
    }).length;

    // Count connected platforms
    const connectedCount = connectionsData.filter(c => c.connected).length;

    return {
      totalPosts,
      publishedPosts,
      scheduledPosts,
      draftPosts,
      upcomingPosts,
      connectedCount,
    };
  }, [selectedPlatform, postsData, connectionsData]);

  // Get recent posts (up to 3 most recent) - memoized
  const recentPosts = useMemo(() => {
    const filteredPosts = selectedPlatform === 'all'
      ? postsData
      : postsData.filter(post => post.platforms?.includes(selectedPlatform));

    return filteredPosts
      .filter(p => p.status === 'published')
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt);
        const dateB = new Date(b.publishedAt || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 3)
      .map(post => ({
        platform: post.platforms[0],
        content: post.content,
        engagement: '0', // Placeholder for real engagement data
        time: formatTimeAgo(new Date(post.publishedAt || post.createdAt)),
      }));
  }, [selectedPlatform, postsData]);

  const formatTimeAgo = useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  }, []);

  // Mock data for fallback when no real data
  const statsData: Record<Platform, typeof defaultStats> = {
    all: [
      { title: "Total Reach", value: "124.5K", change: "+12.5%", icon: <Users className="w-5 h-5" />, isPositive: true },
      { title: "Engagement", value: "8,432", change: "+8.2%", icon: <Heart className="w-5 h-5" />, isPositive: true },
      { title: "New Messages", value: "56", change: "+23%", icon: <MessageSquare className="w-5 h-5" />, isPositive: true },
      { title: "Scheduled Posts", value: "18", change: "Next 7 days", icon: <Calendar className="w-5 h-5" />, isPositive: true },
    ],
    twitter: [
      { title: "Total Reach", value: "45.2K", change: "+15.3%", icon: <Users className="w-5 h-5" />, isPositive: true },
      { title: "Engagement", value: "2,845", change: "+10.1%", icon: <Heart className="w-5 h-5" />, isPositive: true },
      { title: "New Messages", value: "12", change: "+18%", icon: <MessageSquare className="w-5 h-5" />, isPositive: true },
      { title: "Scheduled Posts", value: "6", change: "Next 7 days", icon: <Calendar className="w-5 h-5" />, isPositive: true },
    ],
    instagram: [
      { title: "Total Reach", value: "38.7K", change: "+22.8%", icon: <Users className="w-5 h-5" />, isPositive: true },
      { title: "Engagement", value: "3,124", change: "+12.5%", icon: <Heart className="w-5 h-5" />, isPositive: true },
      { title: "New Messages", value: "24", change: "+35%", icon: <MessageSquare className="w-5 h-5" />, isPositive: true },
      { title: "Scheduled Posts", value: "5", change: "Next 7 days", icon: <Calendar className="w-5 h-5" />, isPositive: true },
    ],
    linkedin: [
      { title: "Total Reach", value: "18.4K", change: "+8.2%", icon: <Users className="w-5 h-5" />, isPositive: true },
      { title: "Engagement", value: "1,256", change: "+5.7%", icon: <Heart className="w-5 h-5" />, isPositive: true },
      { title: "New Messages", value: "8", change: "+14%", icon: <MessageSquare className="w-5 h-5" />, isPositive: true },
      { title: "Scheduled Posts", value: "3", change: "Next 7 days", icon: <Calendar className="w-5 h-5" />, isPositive: true },
    ],
    facebook: [
      { title: "Total Reach", value: "28.9K", change: "+9.4%", icon: <Users className="w-5 h-5" />, isPositive: true },
      { title: "Engagement", value: "1,892", change: "+7.8%", icon: <Heart className="w-5 h-5" />, isPositive: true },
      { title: "New Messages", value: "15", change: "+20%", icon: <MessageSquare className="w-5 h-5" />, isPositive: true },
      { title: "Scheduled Posts", value: "4", change: "Next 7 days", icon: <Calendar className="w-5 h-5" />, isPositive: true },
    ],
    youtube: [
      { title: "Total Reach", value: "52.3K", change: "+18.9%", icon: <Users className="w-5 h-5" />, isPositive: true },
      { title: "Engagement", value: "4,567", change: "+15.2%", icon: <Heart className="w-5 h-5" />, isPositive: true },
      { title: "New Messages", value: "32", change: "+28%", icon: <MessageSquare className="w-5 h-5" />, isPositive: true },
      { title: "Scheduled Posts", value: "2", change: "Next 7 days", icon: <Calendar className="w-5 h-5" />, isPositive: true },
    ],
    tiktok: [
      { title: "Total Reach", value: "68.5K", change: "+45.6%", icon: <Users className="w-5 h-5" />, isPositive: true },
      { title: "Engagement", value: "5,892", change: "+38.4%", icon: <Heart className="w-5 h-5" />, isPositive: true },
      { title: "New Messages", value: "42", change: "+52%", icon: <MessageSquare className="w-5 h-5" />, isPositive: true },
      { title: "Scheduled Posts", value: "7", change: "Next 7 days", icon: <Calendar className="w-5 h-5" />, isPositive: true },
    ],
    pinterest: [
      { title: "Total Reach", value: "24.1K", change: "+11.3%", icon: <Users className="w-5 h-5" />, isPositive: true },
      { title: "Engagement", value: "1,456", change: "+9.8%", icon: <Heart className="w-5 h-5" />, isPositive: true },
      { title: "New Messages", value: "6", change: "+15%", icon: <MessageSquare className="w-5 h-5" />, isPositive: true },
      { title: "Scheduled Posts", value: "3", change: "Next 7 days", icon: <Calendar className="w-5 h-5" />, isPositive: true },
    ],
    reddit: [
      { title: "Total Reach", value: "32.8K", change: "+13.7%", icon: <Users className="w-5 h-5" />, isPositive: true },
      { title: "Engagement", value: "2,345", change: "+16.4%", icon: <Heart className="w-5 h-5" />, isPositive: true },
      { title: "New Messages", value: "18", change: "+25%", icon: <MessageSquare className="w-5 h-5" />, isPositive: true },
      { title: "Scheduled Posts", value: "4", change: "Next 7 days", icon: <Calendar className="w-5 h-5" />, isPositive: true },
    ],
    blog: [
      { title: "Total Reach", value: "12.6K", change: "+7.8%", icon: <Users className="w-5 h-5" />, isPositive: true },
      { title: "Engagement", value: "892", change: "+6.3%", icon: <Heart className="w-5 h-5" />, isPositive: true },
      { title: "New Messages", value: "4", change: "+12%", icon: <MessageSquare className="w-5 h-5" />, isPositive: true },
      { title: "Scheduled Posts", value: "2", change: "Next 7 days", icon: <Calendar className="w-5 h-5" />, isPositive: true },
    ],
  };

  const recentPostsData: Record<Platform, typeof recentPosts> = {
    all: [
      { platform: "twitter", content: "Just launched our new feature! 🚀", engagement: "1.2K", time: "2h ago" },
      { platform: "instagram", content: "Behind the scenes of our creative process", engagement: "3.5K", time: "5h ago" },
      { platform: "linkedin", content: "Thoughts on the future of content creation", engagement: "892", time: "1d ago" },
    ],
    twitter: [
      { platform: "twitter", content: "Just launched our new feature! 🚀", engagement: "1.2K", time: "2h ago" },
      { platform: "twitter", content: "5 tips for better productivity 🧵", engagement: "892", time: "8h ago" },
      { platform: "twitter", content: "Excited to announce our partnership with...", engagement: "1.5K", time: "1d ago" },
    ],
    instagram: [
      { platform: "instagram", content: "Behind the scenes of our creative process", engagement: "3.5K", time: "5h ago" },
      { platform: "instagram", content: "New reel: Morning routine essentials ☀️", engagement: "4.2K", time: "12h ago" },
      { platform: "instagram", content: "Carousel: 10 must-have tools for creators", engagement: "2.8K", time: "2d ago" },
    ],
    linkedin: [
      { platform: "linkedin", content: "Thoughts on the future of content creation", engagement: "892", time: "1d ago" },
      { platform: "linkedin", content: "3 lessons learned from building in public", engagement: "1.1K", time: "3d ago" },
      { platform: "linkedin", content: "Why consistency beats perfection every time", engagement: "756", time: "5d ago" },
    ],
    facebook: [
      { platform: "facebook", content: "Live event recap - Thank you for joining!", engagement: "1.8K", time: "4h ago" },
      { platform: "facebook", content: "Community poll: What content do you want next?", engagement: "945", time: "1d ago" },
      { platform: "facebook", content: "Video: A day in the life of a content creator", engagement: "2.3K", time: "3d ago" },
    ],
    youtube: [
      { platform: "youtube", content: "New Tutorial: Mastering Content Strategy", engagement: "5.2K", time: "6h ago" },
      { platform: "youtube", content: "Short: Quick tip for better engagement", engagement: "3.8K", time: "1d ago" },
      { platform: "youtube", content: "Product Review: Top Tools for 2025", engagement: "4.5K", time: "4d ago" },
    ],
    tiktok: [
      { platform: "tiktok", content: "Viral trend: How we jumped on it early 🔥", engagement: "12.5K", time: "3h ago" },
      { platform: "tiktok", content: "Life hack: Save hours with this trick", engagement: "8.9K", time: "10h ago" },
      { platform: "tiktok", content: "Behind the scenes of our content creation", engagement: "6.7K", time: "2d ago" },
    ],
    pinterest: [
      { platform: "pinterest", content: "Infographic: 2025 Content Trends", engagement: "892", time: "8h ago" },
      { platform: "pinterest", content: "Pin board: DIY workspace inspiration", engagement: "1.2K", time: "2d ago" },
      { platform: "pinterest", content: "Design tips for better social posts", engagement: "745", time: "4d ago" },
    ],
    reddit: [
      { platform: "reddit", content: "AMA: Ask me anything about content creation", engagement: "2.1K", time: "5h ago" },
      { platform: "reddit", content: "Discussion: What's working in 2025?", engagement: "1.5K", time: "1d ago" },
      { platform: "reddit", content: "Sharing my journey: 0 to 100K followers", engagement: "3.2K", time: "3d ago" },
    ],
    blog: [
      { platform: "blog", content: "Complete Guide to Content Marketing in 2025", engagement: "567", time: "1d ago" },
      { platform: "blog", content: "Tutorial: Setting Up Your Creator Workflow", engagement: "423", time: "5d ago" },
      { platform: "blog", content: "Case Study: How We Grew Our Audience 10x", engagement: "689", time: "1w ago" },
    ],
  };

  const defaultStats = statsData[selectedPlatform];
  const automationRules = getAutomationRules();
  const enabledRules = automationRules.filter(r => r.enabled);

  // Build real stats array
  const realStats = [
    { 
      title: "Total Posts", 
      value: stats.totalPosts.toString(), 
      change: `${stats.publishedPosts} published`, 
      icon: <MessageSquare className="w-5 h-5" />, 
      isPositive: true 
    },
    { 
      title: "Connected Platforms", 
      value: stats.connectedCount.toString(), 
      change: `of ${connectionsData.length} platforms`, 
      icon: <Link2 className="w-5 h-5" />, 
      isPositive: true 
    },
    { 
      title: "Drafts", 
      value: stats.draftPosts.toString(), 
      change: "Ready to publish", 
      icon: <Heart className="w-5 h-5" />, 
      isPositive: true 
    },
    { 
      title: "Scheduled", 
      value: stats.upcomingPosts.toString(), 
      change: "Next 7 days", 
      icon: <Calendar className="w-5 h-5" />, 
      isPositive: true 
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Checklist */}
      <OnboardingChecklist />
      
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-emerald-400">
            {selectedPlatform === 'all' ? 'All Platforms' : selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
          </h2>
          <p className="text-muted-foreground">Your content performance at a glance</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="hover:bg-emerald-500/10 hover:border-emerald-500/30"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="dashboard">
        {realStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Automation Summary */}
      {enabledRules.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-lg">
                <Workflow className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3>Active Repurposing Automation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {enabledRules.length} {enabledRules.length === 1 ? 'rule' : 'rules'} automatically repurposing your content
                </p>
              </div>
            </div>
            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
              {automationRules.reduce((sum, r) => sum + r.executionCount, 0)} total runs
            </Badge>
          </div>
          <div className="space-y-2">
            {enabledRules.slice(0, 3).map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rule.trigger.platform} → {getTransformationLabel(rule.transformation)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {rule.executionCount} runs
                </Badge>
              </div>
            ))}
            {enabledRules.length > 3 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                +{enabledRules.length - 3} more rules
              </p>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3>Recent Posts</h3>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {recentPosts.length > 0 ? (
              recentPosts.map((post, index) => (
                <div key={index} className="pb-4 border-b last:border-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-md">
                          <PlatformIcon platform={post.platform} className="w-3.5 h-3.5" />
                          <span className="text-sm capitalize">{post.platform}</span>
                        </div>
                        <span className="text-muted-foreground text-sm">{post.time}</span>
                      </div>
                      <p className="mt-2 line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span className="text-sm text-muted-foreground">Published</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No published posts yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first post to see it here
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3>Connected Platforms</h3>
            <Link2 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {connectionsData.filter(c => c.connected).length > 0 ? (
              <>
                {connectionsData
                  .filter(c => c.connected)
                  .map((connection, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={connection.platform} className="w-5 h-5" />
                        <div>
                          <p className="text-sm capitalize">{connection.name}</p>
                          {connection.username && (
                            <p className="text-xs text-muted-foreground">{connection.username}</p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="bg-green-500/10 text-green-400 border-green-500/30"
                      >
                        Active
                      </Badge>
                    </div>
                  ))}
                {connectionsData.filter(c => !c.connected).length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center">
                      {connectionsData.filter(c => !c.connected).length} platform{connectionsData.filter(c => !c.connected).length !== 1 ? 's' : ''} available to connect
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Link2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No platforms connected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Go to Settings to connect platforms
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>Quick Actions</h3>
          <Zap className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button 
            onClick={() => window.location.href = '/library'}
            className="p-4 border border-violet-500/20 rounded-lg hover:bg-violet-500/10 transition-all hover:border-violet-500/40 text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4>Repurpose Now</h4>
                <p className="text-muted-foreground text-sm">Transform existing content</p>
              </div>
            </div>
          </button>
          <button 
            onClick={() => onNavigate?.("compose")}
            className="p-4 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-all hover:border-blue-500/40 text-left group"
            data-tour="compose"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4>Create New Post</h4>
                <p className="text-muted-foreground text-sm">Publish to all platforms</p>
              </div>
            </div>
          </button>
          <button 
            onClick={() => onNavigate?.("calendar")}
            className="p-4 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-all hover:border-purple-500/40 text-left group"
            data-tour="calendar"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4>Schedule Content</h4>
                <p className="text-muted-foreground text-sm">Plan your content calendar</p>
              </div>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
});
