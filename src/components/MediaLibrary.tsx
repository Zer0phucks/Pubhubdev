import { useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { PlatformIcon } from "./PlatformIcon";
import { 
  Sparkles, 
  Eye, 
  MessageSquare, 
  ThumbsUp, 
  Calendar,
  Filter,
  Search,
  ArrowRight,
  FileText,
  Twitter,
  Linkedin,
  Mail,
  Download,
  Zap
} from "lucide-react";
import { Input } from "./ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { matchAutomationRules, getTransformationLabel } from "../utils/automationRules";

type ContentPlatform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";
type ContentStatus = "new" | "processed" | "scheduled";

interface Content {
  id: string;
  platform: "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  duration?: string;
  status: ContentStatus;
  hasTranscript?: boolean;
  type: "video" | "post" | "image" | "article";
}

// Media library content will be loaded from user's connected platforms
// This will be populated when platform integrations are connected

interface MediaLibraryProps {
  selectedPlatform?: ContentPlatform;
  onRemix?: (content: {
    id: string;
    platform: string;
    title: string;
    description: string;
    thumbnail: string;
    type: string;
  }) => void;
}

export function MediaLibrary({ selectedPlatform = "all", onRemix }: MediaLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "views" | "engagement">("recent");
  const [content, setContent] = useState<Content[]>([]);

  const filteredContent = content.filter((item) => {
    const matchesPlatform = selectedPlatform === "all" || content.platform === selectedPlatform;
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case "views":
        return b.views - a.views;
      case "engagement":
        return (b.likes + b.comments) - (a.likes + a.comments);
      case "recent":
      default:
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const handleRemix = (content: Content) => {
    if (onRemix) {
      onRemix({
        id: content.id,
        platform: content.platform,
        title: content.title,
        description: content.description,
        thumbnail: content.thumbnail,
        type: content.type,
      });
    }
  };

  const getStatusColor = (status: ContentStatus) => {
    switch (status) {
      case "new":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "processed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "scheduled":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Remix</h1>
        <p className="text-muted-foreground mt-2">
          Remix your content from any platform into new formats with AI assistance
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "recent" | "views" | "engagement")}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="engagement">Most Engagement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedContent.map((content) => {
          const matchingRules = content.type === "video" && content.duration ? matchAutomationRules({
            platform: content.platform as "youtube" | "tiktok",
            duration: content.duration,
            title: content.title,
            description: content.description,
          }) : [];

          return (
          <Card key={content.id} className="group overflow-hidden hover:border-primary/50 transition-all">
            <CardHeader className="p-0">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <ImageWithFallback
                  src={content.thumbnail}
                  alt={content.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2 flex-wrap max-w-[calc(100%-4rem)]">
                  <Badge className={getStatusColor(content.status)}>
                    {content.status === "new" && "New"}
                    {content.status === "processed" && "Processed"}
                    {content.status === "scheduled" && "Scheduled"}
                  </Badge>
                  {content.hasTranscript && (
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                      <FileText className="w-3 h-3 mr-1" />
                      Transcript
                    </Badge>
                  )}
                  {matchingRules.length > 0 && (
                    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                      <Zap className="w-3 h-3 mr-1" />
                      Auto
                    </Badge>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <PlatformIcon platform={content.platform} className="w-6 h-6" />
                </div>
                {content.duration && (
                  <div className="absolute bottom-3 right-3">
                    <Badge variant="secondary" className="bg-black/80 backdrop-blur-sm">
                      {content.duration}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="line-clamp-2 group-hover:text-primary transition-colors">
                  {content.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                  {content.description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{formatNumber(content.views)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{formatNumber(content.likes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{formatNumber(content.comments)}</span>
                </div>
              </div>

              {/* Automation Info */}
              {matchingRules.length > 0 && (
                <div className="text-xs text-yellow-400 bg-yellow-500/5 border border-yellow-500/20 rounded p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3" />
                    <span className="font-medium">Will auto-remix to:</span>
                  </div>
                  <div className="space-y-1">
                    {matchingRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-yellow-300">
                          {getTransformationLabel(rule.transformation)}
                        </span>
                        {rule.transformationInstructions && (
                          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                            Custom
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(content.publishedAt)}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleRemix(content)}
                  className="gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  Remix
                </Button>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {sortedContent.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Download className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3>No content found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search query or select a different platform
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
