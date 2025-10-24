import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { PlatformIcon } from "./PlatformIcon";
import { AITextGenerator } from "./AITextGenerator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Sparkles, Plus, X } from "lucide-react";
import type { Platform, ContentTemplate, TemplateCategory } from "../types";
import { toast } from "sonner@2.0.3";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: ContentTemplate) => void;
  initialContent?: string;
  initialPlatforms?: Platform[];
  editingTemplate?: ContentTemplate | null;
}

const categoryOptions: { value: TemplateCategory; label: string; emoji: string }[] = [
  { value: "announcement", label: "Announcement", emoji: "📢" },
  { value: "educational", label: "Educational", emoji: "📚" },
  { value: "promotional", label: "Promotional", emoji: "📈" },
  { value: "engagement", label: "Engagement", emoji: "👥" },
  { value: "behind-scenes", label: "Behind the Scenes", emoji: "🎬" },
  { value: "storytelling", label: "Storytelling", emoji: "❤️" },
];

const platformOptions: Platform[] = [
  "twitter", "instagram", "linkedin", "facebook", "youtube", "tiktok", "pinterest", "reddit", "blog"
];

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onSave,
  initialContent = "",
  initialPlatforms = [],
  editingTemplate = null,
}: CreateTemplateDialogProps) {
  const [title, setTitle] = useState(editingTemplate?.title || "");
  const [category, setCategory] = useState<TemplateCategory>(editingTemplate?.category || "engagement");
  const [content, setContent] = useState(editingTemplate?.content || initialContent);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(
    editingTemplate?.platforms || initialPlatforms
  );
  const [hashtags, setHashtags] = useState<string[]>(editingTemplate?.hashtags || []);
  const [newHashtag, setNewHashtag] = useState("");

  const handleReset = () => {
    if (!editingTemplate) {
      setTitle("");
      setCategory("engagement");
      setContent(initialContent);
      setSelectedPlatforms(initialPlatforms);
      setHashtags([]);
      setNewHashtag("");
    }
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const addHashtag = () => {
    if (newHashtag.trim()) {
      const tag = newHashtag.trim().startsWith('#') ? newHashtag.trim() : `#${newHashtag.trim()}`;
      if (!hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
        setNewHashtag("");
      }
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a template title");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter template content");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    const categoryEmoji = categoryOptions.find(c => c.value === category)?.emoji || "✨";

    const template: ContentTemplate = {
      id: editingTemplate?.id || `custom-${Date.now()}`,
      title: title.trim(),
      category,
      content: content.trim(),
      platforms: selectedPlatforms,
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      emoji: categoryEmoji,
    };

    onSave(template);
    toast.success(editingTemplate ? "Template updated!" : "Template created!");
    handleClose();
  };

  const selectedCategory = categoryOptions.find(c => c.value === category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            {editingTemplate ? "Edit Template" : "Create Custom Template"}
          </DialogTitle>
          <DialogDescription>
            {editingTemplate 
              ? "Update your custom template to use it again later"
              : "Save this content as a reusable template for future posts"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Title */}
          <div>
            <Label htmlFor="title">Template Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Weekly Newsletter Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as TemplateCategory)}>
              <SelectTrigger className="mt-2">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span>{selectedCategory?.emoji}</span>
                    <span>{selectedCategory?.label}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.emoji}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="content">Template Content *</Label>
              <AITextGenerator
                onGenerate={(text) => setContent(text)}
                contextType="template"
                placeholder="e.g., 'Create a template for product announcements'"
                variant="button"
                buttonText="Generate Template"
              />
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Use placeholders like [Your Topic], [Date], or [Product Name] to make it easy to customize later
            </p>
            <div className="relative">
              <Textarea
                id="content"
                placeholder="Write your template content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-none pr-12"
              />
              <div className="absolute top-2 right-2">
                <AITextGenerator
                  onGenerate={(text) => setContent(text)}
                  contextType="template"
                  placeholder="e.g., 'Create a template for...'"
                  variant="icon"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {content.length} characters
            </p>
          </div>

          {/* Platforms */}
          <div>
            <Label>Recommended Platforms *</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Select which platforms this template works best for
            </p>
            <div className="grid grid-cols-3 gap-3">
              {platformOptions.map((platform) => (
                <div
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:border-emerald-500/30 ${
                    selectedPlatforms.includes(platform)
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border"
                  }`}
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(platform)}
                    onCheckedChange={() => togglePlatform(platform)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <PlatformIcon platform={platform} className="w-4 h-4" size={16} />
                  <span className="text-sm capitalize">{platform}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <Label htmlFor="hashtags">Suggested Hashtags (Optional)</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Add hashtags that work well with this template
            </p>
            <div className="flex gap-2">
              <Input
                id="hashtags"
                placeholder="e.g., ContentCreator"
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addHashtag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addHashtag}
                className="hover:bg-emerald-500/10 hover:border-emerald-500/30"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {hashtags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-blue-500/10 text-blue-400 border-blue-500/30 pr-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeHashtag(tag)}
                      className="ml-1 hover:text-blue-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
