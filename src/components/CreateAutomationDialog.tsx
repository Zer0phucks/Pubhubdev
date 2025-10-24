import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { PlatformIcon } from "./PlatformIcon";
import { 
  Zap, 
  FileText, 
  Twitter, 
  Linkedin, 
  Mail, 
  MessageSquare,
  Sparkles,
  Clock,
  X,
  Plus
} from "lucide-react";
import { 
  AutomationRule, 
  TriggerPlatform, 
  TransformationType, 
  ActionType,
  getTransformationLabel,
  getActionLabel
} from "../utils/automationRules";

interface CreateAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'>) => void;
  editRule?: AutomationRule | null;
}

const transformationOptions: { id: TransformationType; label: string; icon: React.ComponentType<{ className?: string }>; platforms: string[] }[] = [
  { id: 'blog', label: 'Blog Post', icon: FileText, platforms: ['blog'] },
  { id: 'social-thread', label: 'Social Media Thread', icon: Twitter, platforms: ['twitter'] },
  { id: 'linkedin-post', label: 'LinkedIn Article', icon: Linkedin, platforms: ['linkedin'] },
  { id: 'social-announcement', label: 'Video Announcement', icon: Sparkles, platforms: ['twitter', 'linkedin', 'facebook', 'instagram'] },
  { id: 'newsletter', label: 'Email Newsletter', icon: Mail, platforms: ['blog'] },
  { id: 'captions', label: 'Repurposed Captions', icon: MessageSquare, platforms: ['instagram', 'tiktok', 'facebook'] },
];

export function CreateAutomationDialog({ open, onOpenChange, onSave, editRule }: CreateAutomationDialogProps) {
  const [name, setName] = useState(editRule?.name || "");
  const [triggerPlatform, setTriggerPlatform] = useState<TriggerPlatform>(editRule?.trigger.platform || "youtube");
  const [minDuration, setMinDuration] = useState(editRule?.trigger.minDuration ? String(Math.floor(editRule.trigger.minDuration / 60)) : "");
  const [keywords, setKeywords] = useState<string[]>(editRule?.trigger.keywords || []);
  const [keywordInput, setKeywordInput] = useState("");
  const [transformation, setTransformation] = useState<TransformationType>(editRule?.transformation || "blog");
  const [transformationInstructions, setTransformationInstructions] = useState(editRule?.transformationInstructions || "");
  const [action, setAction] = useState<ActionType>(editRule?.action || "draft");
  
  const selectedTransformation = transformationOptions.find(t => t.id === transformation);

  // Dynamic placeholder text based on transformation type
  const getInstructionsPlaceholder = () => {
    const placeholders: Record<TransformationType, string> = {
      'blog': 'e.g., Use a conversational tone, include relevant statistics, add actionable takeaways at the end, keep paragraphs short for readability...',
      'social-thread': 'e.g., Start with a compelling hook, use emojis sparingly, keep each tweet concise, end with a call-to-action...',
      'linkedin-post': 'e.g., Use a professional yet approachable tone, highlight business value, include industry insights, format with clear sections...',
      'social-announcement': 'e.g., Keep it exciting and concise, emphasize the value, include a clear CTA, use platform-appropriate language...',
      'newsletter': 'e.g., Use a friendly tone, personalize the message, include a compelling subject line suggestion, add multiple CTAs...',
      'captions': 'e.g., Use trending hashtags, keep it short and punchy, match the platform\'s tone, include emoji where appropriate...',
    };
    return placeholders[transformation];
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleSave = () => {
    const rule: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'> = {
      name: name.trim() || `Auto-remix ${triggerPlatform} videos to ${getTransformationLabel(transformation)}`,
      enabled: editRule?.enabled ?? true,
      trigger: {
        platform: triggerPlatform,
        minDuration: minDuration ? parseInt(minDuration) * 60 : undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
      },
      transformation,
      transformationInstructions: transformationInstructions.trim() || undefined,
      action,
      targetPlatforms: selectedTransformation?.platforms || [],
      lastTriggered: editRule?.lastTriggered,
    };

    onSave(rule);
    handleClose();
  };

  const handleClose = () => {
    if (!editRule) {
      setName("");
      setTriggerPlatform("youtube");
      setMinDuration("");
      setKeywords([]);
      setKeywordInput("");
      setTransformation("blog");
      setTransformationInstructions("");
      setAction("draft");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            {editRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
          </DialogTitle>
          <DialogDescription>
            Automatically remix your videos into other content formats when they're published
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rule Name */}
          <div className="space-y-2">
            <Label>Rule Name (Optional)</Label>
            <Input
              placeholder="e.g., YouTube videos to blog posts"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Trigger */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h4>When this happens...</h4>
              </div>

              <div className="space-y-4 ml-6">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={triggerPlatform} onValueChange={(value) => setTriggerPlatform(value as TriggerPlatform)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform="youtube" className="w-4 h-4" />
                          <span>New YouTube video</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="tiktok">
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform="tiktok" className="w-4 h-4" />
                          <span>New TikTok video</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Optional Filters */}
                <div className="space-y-3 border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">Optional Filters</p>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Minimum Duration (minutes)</Label>
                    <Input
                      type="number"
                      placeholder="Any duration"
                      value={minDuration}
                      onChange={(e) => setMinDuration(e.target.value)}
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Keywords (optional - video must contain at least one)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., tutorial, tips"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddKeyword();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={handleAddKeyword}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="gap-1">
                            {keyword}
                            <button
                              onClick={() => handleRemoveKeyword(keyword)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transformation */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h4>Remix it into...</h4>
              </div>

              <div className="ml-6 space-y-2">
                <Label>Content Type</Label>
                <Select value={transformation} onValueChange={(value) => setTransformation(value as TransformationType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transformationOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {selectedTransformation && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Target platforms:</span>
                    <div className="flex items-center gap-1">
                      {selectedTransformation.platforms.map((platform) => (
                        <PlatformIcon key={platform} platform={platform as any} className="w-4 h-4" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Instructions */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Custom Instructions (Optional)</Label>
                    {transformationInstructions && (
                      <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                        {transformationInstructions.length} characters
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    placeholder={getInstructionsPlaceholder()}
                    value={transformationInstructions}
                    onChange={(e) => setTransformationInstructions(e.target.value)}
                    className="min-h-[100px] resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Provide specific guidelines for how the AI should remix your content. This helps maintain your brand voice and content style.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <h4>Then do this...</h4>
              </div>

              <div className="ml-6 space-y-2">
                <Label>Action</Label>
                <Select value={action} onValueChange={(value) => setAction(value as ActionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Save as Draft</SelectItem>
                    <SelectItem value="review">Save for Review</SelectItem>
                    <SelectItem value="auto-publish">
                      <div className="flex items-center gap-2">
                        <span>Auto-Publish</span>
                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                          Advanced
                        </Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {action === 'draft' && 'Content will be saved as a draft in the composer'}
                  {action === 'review' && 'Content will be flagged for your review before publishing'}
                  {action === 'auto-publish' && 'Content will be automatically published (use with caution)'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() && !transformation}>
            {editRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
