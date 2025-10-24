import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { PlatformIcon } from "./PlatformIcon";
import { 
  FileText, 
  Twitter, 
  Linkedin, 
  Instagram,
  Facebook,
  Mail,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { transformVideoContent, TransformedContent } from "../utils/contentTransformer";

interface Video {
  id: string;
  platform: "youtube" | "tiktok";
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  status: "new" | "processed" | "scheduled";
  hasTranscript?: boolean;
}

interface TransformVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
  onTransform?: (content: TransformedContent) => void;
}

interface TransformOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  platforms?: string[];
  estimatedTime: string;
  requiresTranscript?: boolean;
  color: string;
}

const transformOptions: TransformOption[] = [
  {
    id: "blog",
    title: "Blog Post",
    description: "Convert video transcript into a comprehensive blog article with headings, sections, and SEO optimization",
    icon: FileText,
    estimatedTime: "2-3 min",
    requiresTranscript: true,
    color: "text-blue-400",
  },
  {
    id: "social-thread",
    title: "Social Media Thread",
    description: "Extract key points into a Twitter/X thread with engaging hooks and calls-to-action",
    icon: Twitter,
    platforms: ["twitter"],
    estimatedTime: "1 min",
    color: "text-sky-400",
  },
  {
    id: "linkedin-post",
    title: "LinkedIn Article",
    description: "Create a professional LinkedIn post highlighting main insights and value propositions",
    icon: Linkedin,
    platforms: ["linkedin"],
    estimatedTime: "1-2 min",
    color: "text-blue-500",
  },
  {
    id: "social-announcement",
    title: "Video Announcement Posts",
    description: "Generate platform-specific announcement posts with video link, thumbnail, and engaging copy",
    icon: Sparkles,
    platforms: ["twitter", "linkedin", "facebook", "instagram"],
    estimatedTime: "1 min",
    color: "text-purple-400",
  },
  {
    id: "newsletter",
    title: "Email Newsletter",
    description: "Format content for email newsletter with embedded video, key takeaways, and CTA",
    icon: Mail,
    estimatedTime: "2 min",
    color: "text-green-400",
  },
  {
    id: "captions",
    title: "Repurpose Captions",
    description: "Adapt video caption/description for other platforms with platform-specific hashtags and formatting",
    icon: MessageSquare,
    platforms: ["instagram", "tiktok", "facebook"],
    estimatedTime: "30 sec",
    color: "text-pink-400",
  },
];

export function TransformVideoDialog({ open, onOpenChange, video, onTransform }: TransformVideoDialogProps) {
  if (!video) return null;

  const handleTransform = (optionId: string) => {
    const option = transformOptions.find(o => o.id === optionId);
    
    if (option?.requiresTranscript && !video.hasTranscript) {
      toast.error("Transcript Required", {
        description: "This transformation requires a video transcript. Transcripts are available for YouTube videos.",
      });
      return;
    }

    // Show loading toast
    toast.loading(`Transforming Content`, {
      description: `Creating ${option?.title} from "${video.title}"...`,
    });

    // Simulate processing time
    setTimeout(() => {
      try {
        // Transform the video content
        const transformedContent = transformVideoContent(video, optionId);
        
        // Dismiss loading toast
        toast.dismiss();
        
        // Show success toast
        toast.success("Transformation Complete", {
          description: "Your content is ready in the composer!",
        });

        // Pass the transformed content back to parent
        if (onTransform) {
          onTransform(transformedContent);
        }

        // Close the dialog
        onOpenChange(false);
      } catch (error) {
        toast.dismiss();
        toast.error("Transformation Failed", {
          description: error instanceof Error ? error.message : "An error occurred during transformation.",
        });
      }
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Transform Video Content
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to repurpose this video content
          </DialogDescription>
        </DialogHeader>

        {/* Video Preview */}
        <Card className="overflow-hidden">
          <div className="flex flex-col md:flex-row gap-4 p-4">
            <div className="relative w-full md:w-48 aspect-video md:aspect-auto flex-shrink-0 overflow-hidden rounded-md">
              <ImageWithFallback
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <PlatformIcon platform={video.platform} className="w-6 h-6" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="line-clamp-2">{video.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                    {video.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="secondary">{video.duration}</Badge>
                <Badge variant="secondary">{video.views.toLocaleString()} views</Badge>
                {video.hasTranscript && (
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Transcript Available
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Transform Options */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span>Select a transformation type</span>
          </div>
          
          <div className="grid gap-3">
            {transformOptions.map((option) => {
              const Icon = option.icon;
              const isDisabled = option.requiresTranscript && !video.hasTranscript;
              
              return (
                <Card 
                  key={option.id}
                  className={`group cursor-pointer transition-all ${
                    isDisabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:border-primary/50 hover:bg-accent/50'
                  }`}
                  onClick={() => !isDisabled && handleTransform(option.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-accent/50 ${isDisabled ? '' : 'group-hover:scale-110 transition-transform'}`}>
                        <Icon className={`w-5 h-5 ${option.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="flex items-center gap-2">
                              {option.title}
                              {isDisabled && (
                                <Badge variant="outline" className="text-xs">
                                  Requires Transcript
                                </Badge>
                              )}
                            </h4>
                            <p className="text-muted-foreground text-sm mt-1">
                              {option.description}
                            </p>
                          </div>
                          {!isDisabled && (
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          {option.platforms && (
                            <div className="flex items-center gap-1">
                              {option.platforms.slice(0, 4).map((platform) => (
                                <PlatformIcon
                                  key={platform}
                                  platform={platform as any}
                                  className="w-4 h-4"
                                />
                              ))}
                              {option.platforms.length > 4 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  +{option.platforms.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{option.estimatedTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {!video.hasTranscript && (
          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-yellow-400">Limited Transformations</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Some transformations require a video transcript. Transcripts are automatically available for YouTube videos.
                    TikTok videos can use caption-based transformations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
