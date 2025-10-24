import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PlatformIcon } from "./PlatformIcon";
import { AITextGenerator } from "./AITextGenerator";
import { getCustomTemplates, type CustomTemplate } from "../utils/customTemplates";
import { postsAPI } from "../utils/api";
import { useProject } from "./ProjectContext";
import { 
  Sparkles, 
  Send, 
  Clock,
  Paperclip,
  X,
  AlertCircle,
  CheckCircle2,
  FileText,
  Wand2,
  Loader2,
} from "lucide-react";
import { PLATFORM_CONSTRAINTS, type Platform, type Attachment } from "../types";
import { toast } from "sonner@2.0.3";
import { TransformedContent } from "../utils/contentTransformer";

interface PlatformSelection {
  id: Platform;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  selectedTemplate?: string;
}

interface RemixContent {
  id: string;
  platform: string;
  title: string;
  description: string;
  thumbnail: string;
  type: string;
}

interface ContentComposerProps {
  transformedContent?: TransformedContent | null;
  remixContent?: RemixContent | null;
  onContentUsed?: () => void;
}

interface GeneratedPreview {
  platform: Platform;
  content: string;
}

export function ContentComposer({ transformedContent = null, remixContent = null, onContentUsed }: ContentComposerProps = {}) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [currentRemixContent, setCurrentRemixContent] = useState<RemixContent | null>(null);
  const [currentTransformation, setCurrentTransformation] = useState<TransformedContent | null>(null);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(getCustomTemplates());
  const [generatedPreviews, setGeneratedPreviews] = useState<GeneratedPreview[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { currentProject } = useProject();

  const [platforms, setPlatforms] = useState<PlatformSelection[]>([
    { id: "twitter", name: "Twitter", icon: <PlatformIcon platform="twitter" />, enabled: true },
    { id: "instagram", name: "Instagram", icon: <PlatformIcon platform="instagram" />, enabled: true },
    { id: "linkedin", name: "LinkedIn", icon: <PlatformIcon platform="linkedin" />, enabled: true },
    { id: "facebook", name: "Facebook", icon: <PlatformIcon platform="facebook" />, enabled: false },
    { id: "youtube", name: "YouTube", icon: <PlatformIcon platform="youtube" />, enabled: false },
    { id: "tiktok", name: "TikTok", icon: <PlatformIcon platform="tiktok" />, enabled: false },
    { id: "pinterest", name: "Pinterest", icon: <PlatformIcon platform="pinterest" />, enabled: false },
    { id: "reddit", name: "Reddit", icon: <PlatformIcon platform="reddit" />, enabled: false },
    { id: "blog", name: "Blog", icon: <PlatformIcon platform="blog" />, enabled: false },
  ]);

  // Handle remixed content from Remix
  useEffect(() => {
    if (remixContent) {
      setCurrentRemixContent(remixContent);
      setContent(remixContent.description);
      setCurrentTransformation(null);
      
      // Show notification about source
      toast.info("Content Loaded from Remix", {
        description: `"${remixContent.title}" from ${remixContent.platform}`,
      });

      // Mark content as used
      if (onContentUsed) {
        onContentUsed();
      }
    }
  }, [remixContent]);

  // Handle transformed content (legacy)
  useEffect(() => {
    if (transformedContent) {
      setContent(transformedContent.content);
      setCurrentTransformation(transformedContent);
      setCurrentRemixContent(null);
      
      // Enable platforms based on transformation type
      setPlatforms(platforms.map(p => ({
        ...p,
        enabled: transformedContent.platforms.includes(p.id)
      })));

      // Show notification about source
      toast.info("Content Loaded", {
        description: `Transformed from "${transformedContent.sourceVideo.title}" (${transformedContent.sourceVideo.platform})`,
      });

      // Mark content as used
      if (onContentUsed) {
        onContentUsed();
      }
    }
  }, [transformedContent]);

  // Refresh templates when component mounts
  useEffect(() => {
    setCustomTemplates(getCustomTemplates());
  }, []);

  const togglePlatform = (id: Platform) => {
    setPlatforms(platforms.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handleTemplateSelect = (platformId: Platform, templateId: string) => {
    setPlatforms(platforms.map(p =>
      p.id === platformId ? { ...p, selectedTemplate: templateId } : p
    ));
  };

  const validateContent = (platform: Platform, contentToValidate: string) => {
    const constraints = PLATFORM_CONSTRAINTS[platform];
    const contentLength = contentToValidate.length;
    const imageCount = attachments.filter(a => a.type.startsWith('image/')).length;
    const videoCount = attachments.filter(a => a.type.startsWith('video/')).length;

    const issues: string[] = [];
    
    if (contentLength > constraints.maxLength) {
      issues.push(`Exceeds character limit (${contentLength}/${constraints.maxLength})`);
    }
    if (imageCount > constraints.maxImages) {
      issues.push(`Too many images (${imageCount}/${constraints.maxImages})`);
    }
    if (videoCount > constraints.maxVideos) {
      issues.push(`Too many videos (${videoCount}/${constraints.maxVideos})`);
    }

    return { isValid: issues.length === 0, issues };
  };

  const generateWithAI = () => {
    const suggestions = [
      "Just discovered an amazing productivity hack that's changed my workflow! 🚀 Who else struggles with time management?",
      "Behind the scenes look at how we create content that resonates. The secret? Authenticity always wins. 💡",
      "Hot take: The best content strategy is the one you can stick to consistently. Quality over quantity, every time. 🎯"
    ];
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    setContent(randomSuggestion);
  };

  const handleFileAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,application/pdf,.doc,.docx,.txt';
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const newAttachments = Array.from(files).map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }));
        
        setAttachments([...attachments, ...newAttachments]);
      }
    };
    
    input.click();
  };

  const removeAttachment = (attachmentName: string) => {
    setAttachments(attachments.filter(a => a.name !== attachmentName));
  };

  const handleGeneratePreviews = () => {
    const enabledPlatforms = platforms.filter(p => p.enabled);
    
    if (enabledPlatforms.length === 0) {
      toast.error("No Platforms Selected", {
        description: "Please select at least one platform to generate previews.",
      });
      return;
    }

    if (!content.trim()) {
      toast.error("No Content", {
        description: "Please add content in the 'Your Content' section.",
      });
      return;
    }

    setIsGenerating(true);

    // Simulate generation
    setTimeout(() => {
      const previews: GeneratedPreview[] = enabledPlatforms.map((platform) => {
        const template = customTemplates.find(t => t.id === platform.selectedTemplate);
        let generatedContent = content;

        if (template) {
          // Apply template to content
          generatedContent = template.content.replace(/\{content\}/g, content.slice(0, 100));
        }

        // Truncate to platform limits
        const maxLength = PLATFORM_CONSTRAINTS[platform.id].maxLength;
        if (generatedContent.length > maxLength) {
          generatedContent = generatedContent.slice(0, maxLength - 3) + "...";
        }

        return {
          platform: platform.id,
          content: generatedContent,
        };
      });

      setGeneratedPreviews(previews);
      setIsGenerating(false);

      toast.success("Previews Generated", {
        description: `Created ${previews.length} preview(s) for your selected platforms.`,
      });
    }, 1500);
  };

  const enabledPlatforms = platforms.filter(p => p.enabled);
  const availableTemplatesForPlatform = (platformId: Platform) => {
    return customTemplates.filter(t => t.platforms.includes(platformId));
  };

  const handlePostNow = async (platform: Platform, content: string) => {
    if (!currentProject) {
      toast.error("No project selected");
      return;
    }
    
    setPublishingPlatforms(prev => new Set(prev).add(platform));
    
    try {
      // Note: In production, we would check if platform is connected
      // For now, we'll save the post to the database
      const { post } = await postsAPI.create({
        projectId: currentProject.id,
        platforms: [platform],
        content,
        status: 'published',
        publishedAt: new Date().toISOString(),
        attachments: attachments.filter(a => a.platform === platform),
      });

      toast.success("Post Published!", {
        description: `Your content has been saved. Connect ${platforms.find(p => p.id === platform)?.name} in Settings to publish live.`,
      });

      // Remove this preview after posting
      setGeneratedPreviews(prev => prev.filter(p => p.platform !== platform));
    } catch (error: any) {
      console.error('Post creation error:', error);
      toast.error("Publishing Failed", {
        description: error.message || "Failed to publish post. Please try again.",
      });
    } finally {
      setPublishingPlatforms(prev => {
        const next = new Set(prev);
        next.delete(platform);
        return next;
      });
    }
  };

  const handleSchedule = async (platform: Platform, content: string) => {
    if (!currentProject) {
      toast.error("No project selected");
      return;
    }
    
    // For now, just show a toast. You could open a date/time picker dialog
    toast.info("Schedule Post", {
      description: "Scheduling feature coming soon! This would save as a draft for now.",
    });

    try {
      await postsAPI.create({
        projectId: currentProject.id,
        platforms: [platform],
        content,
        status: 'draft',
        attachments: attachments.filter(a => a.platform === platform),
      });

      toast.success("Saved as Draft", {
        description: "Your post has been saved as a draft.",
      });
    } catch (error: any) {
      console.error('Draft save error:', error);
      toast.error("Save Failed", {
        description: error.message || "Failed to save draft.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-emerald-400 mb-2">Create Content</h2>
        <p className="text-muted-foreground">
          Create content from scratch or use your remixed content
        </p>
      </div>

      {/* Project Indicator */}
      {!currentProject && (
        <Alert className="border-yellow-500/30 bg-yellow-500/10">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <AlertDescription className="text-yellow-400">
            No project selected. Please select a project from the sidebar to create content.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Your Content */}
        <div className="lg:col-span-1 space-y-6">
          {/* Remix Content Display */}
          {currentRemixContent && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-emerald-400">Remix Source</h3>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                  <ImageWithFallback
                    src={currentRemixContent.thumbnail}
                    alt={currentRemixContent.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <PlatformIcon platform={currentRemixContent.platform as any} className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h4 className="line-clamp-2">{currentRemixContent.title}</h4>
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-3">
                    {currentRemixContent.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentRemixContent(null);
                    setContent("");
                    toast.success("Source cleared");
                  }}
                  className="w-full"
                >
                  Clear Source
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Transformed Content Display (Legacy) */}
          {currentTransformation && !currentRemixContent && (
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-400">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Content transformed from video</span>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <PlatformIcon platform={currentTransformation.sourceVideo.platform as any} className="w-4 h-4" />
                    <span className="truncate">{currentTransformation.sourceVideo.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentTransformation(null);
                      setContent("");
                      toast.success("Content cleared");
                    }}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 w-full"
                  >
                    Clear
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Your Content Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <h3>Your Content</h3>
                </div>
                <AITextGenerator
                  onGenerate={(text) => setContent(text)}
                  contextType="post"
                  placeholder="e.g., 'Write an engaging post about productivity tips'"
                  variant="button"
                  buttonText="Generate with AI"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    placeholder="Add your content here to use with templates..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="resize-none pr-12"
                  />
                  <div className="absolute top-2 right-2">
                    <AITextGenerator
                      onGenerate={(text) => setContent(text)}
                      contextType="post"
                      placeholder="e.g., 'Write an engaging post about...'"
                      variant="icon"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{content.length} characters</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateWithAI}
                    className="gap-2"
                  >
                    <Wand2 className="w-3 h-3" />
                    AI Suggest
                  </Button>
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label>Attachments</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFileAttachment}
                  className="w-full gap-2"
                >
                  <Paperclip className="w-4 h-4" />
                  Add Files
                </Button>
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.name}
                        className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                      >
                        <span className="truncate flex-1">{attachment.name}</span>
                        <button
                          onClick={() => removeAttachment(attachment.name)}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Platform Selection & Previews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Selection */}
          <Card>
            <CardHeader>
              <h3>Select Platforms</h3>
              <p className="text-muted-foreground text-sm">
                Choose platforms and templates for your content
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className={`p-4 border rounded-lg transition-all ${
                      platform.enabled
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {platform.icon}
                        <span>{platform.name}</span>
                      </div>
                      <Switch
                        checked={platform.enabled}
                        onCheckedChange={() => togglePlatform(platform.id)}
                      />
                    </div>

                    {platform.enabled && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Max: {PLATFORM_CONSTRAINTS[platform.id].maxLength} chars
                          </span>
                        </div>

                        {/* Template Dropdown */}
                        <div className="space-y-1">
                          <Label className="text-xs">Template</Label>
                          <Select
                            value={platform.selectedTemplate || "none"}
                            onValueChange={(value) =>
                              handleTemplateSelect(
                                platform.id,
                                value === "none" ? "" : value
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="No template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No template</SelectItem>
                              {availableTemplatesForPlatform(platform.id).map(
                                (template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Generate Previews Button */}
              <Button
                onClick={handleGeneratePreviews}
                disabled={enabledPlatforms.length === 0 || !content.trim() || isGenerating}
                className="w-full gap-2"
                size="lg"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? "Generating..." : "Generate Previews"}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Previews */}
          {generatedPreviews.length > 0 && (
            <Card>
              <CardHeader>
                <h3>Generated Previews</h3>
                <p className="text-muted-foreground text-sm">
                  Review and edit your content for each platform
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedPreviews.map((preview) => {
                  const platform = platforms.find(p => p.id === preview.platform);
                  const validation = validateContent(preview.platform, preview.content);

                  return (
                    <Card key={preview.platform} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={preview.platform} className="w-5 h-5" />
                            <span>{platform?.name}</span>
                          </div>
                          {validation.isValid ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Issues
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          value={preview.content}
                          onChange={(e) => {
                            setGeneratedPreviews(
                              generatedPreviews.map((p) =>
                                p.platform === preview.platform
                                  ? { ...p, content: e.target.value }
                                  : p
                              )
                            );
                          }}
                          rows={4}
                          className="resize-none"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {preview.content.length} / {PLATFORM_CONSTRAINTS[preview.platform].maxLength}
                          </span>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSchedule(preview.platform, preview.content)}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              Schedule
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handlePostNow(preview.platform, preview.content)}
                              disabled={!validation.isValid || publishingPlatforms.has(preview.platform)}
                            >
                              {publishingPlatforms.has(preview.platform) ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Posting...
                                </>
                              ) : (
                                <>
                                  <Send className="w-3 h-3 mr-1" />
                                  Post Now
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        {!validation.isValid && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="w-4 h-4" />
                            <AlertDescription>
                              <ul className="list-disc list-inside text-sm">
                                {validation.issues.map((issue, idx) => (
                                  <li key={idx}>{issue}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
