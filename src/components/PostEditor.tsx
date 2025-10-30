import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { PlatformIcon } from "./PlatformIcon";
import { 
  Paperclip,
  X,
  Sparkles,
  Calendar as CalendarIcon,
  Clock
} from "lucide-react";

interface Attachment {
  name: string;
  size: number;
  type: string;
}

type Platform = "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface PostEditorData {
  content?: string;
  platform?: string;
  time?: string;
  date?: Date;
  attachments?: Attachment[];
  crossPostTo?: Platform[];
  recurrence?: { frequency: "none" | "daily" | "weekly" | "monthly" };
}

interface PostEditorProps {
  initialData?: PostEditorData;
  initialContent?: string;
  initialPlatform?: string;
  initialTime?: string;
  initialDate?: Date;
  initialAttachments?: Attachment[];
  initialCrossPostTo?: Platform[];
  onSave?: (data: {
    content: string;
    platform: string;
    time: string;
    date: Date;
    attachments: Attachment[];
    crossPostTo?: Platform[];
    recurrence?: { frequency: "none" | "daily" | "weekly" | "monthly" };
  }) => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export function PostEditor({
  initialData,
  initialContent = "",
  initialPlatform = "twitter",
  initialTime = "",
  initialDate = new Date(),
  initialAttachments = [],
  initialCrossPostTo = [],
  onSave,
  onCancel,
  showActions = true,
}: PostEditorProps) {
  // Support both initialData object and individual props
  const data = initialData || {};
  const _initialContent = data.content ?? initialContent;
  const _initialPlatform = data.platform ?? initialPlatform;
  const _initialTime = data.time ?? initialTime;
  const _initialDate = data.date ?? initialDate;
  const _initialAttachments = data.attachments ?? initialAttachments;
  const _initialCrossPostTo = data.crossPostTo ?? initialCrossPostTo;
  // Convert "10:00 AM" format to "10:00" for the time input
  const convertTo24Hour = (time12h: string) => {
    if (!time12h) return "";
    const match = time12h.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return time12h; // Already in 24hr format
    
    let [, hours, minutes, period] = match;
    let hour = parseInt(hours);
    
    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const [content, setContent] = useState(_initialContent);
  const [platform, setPlatform] = useState(_initialPlatform);
  const [time, setTime] = useState(convertTo24Hour(_initialTime));
  const [date, setDate] = useState(_initialDate);
  const [attachments, setAttachments] = useState<Attachment[]>(_initialAttachments);
  const [crossPostTo, setCrossPostTo] = useState<Platform[]>(_initialCrossPostTo);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"none" | "daily" | "weekly" | "monthly">(
    (data.recurrence?.frequency as any) || "none"
  );

  const platforms = [
    { value: "twitter", label: "Twitter" },
    { value: "instagram", label: "Instagram" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "facebook", label: "Facebook" },
    { value: "youtube", label: "YouTube" },
    { value: "tiktok", label: "TikTok" },
    { value: "pinterest", label: "Pinterest" },
    { value: "reddit", label: "Reddit" },
    { value: "blog", label: "Blog" },
  ];

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

  const generateWithAI = () => {
    const suggestions = [
      "Just discovered an amazing productivity hack that's changed my workflow! 🚀 Who else struggles with time management?",
      "Behind the scenes look at how we create content that resonates. The secret? Authenticity always wins. 💡",
      "Hot take: The best content strategy is the one you can stick to consistently. Quality over quantity, every time. 🎯",
      "Sharing some insights from today's creative session. The process is just as important as the outcome! ✨",
      "Quick reminder: Your progress doesn't have to be perfect. It just has to be real. Keep going! 💪",
    ];
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    setContent(randomSuggestion);
  };

  const toggleCrossPost = (platformValue: Platform) => {
    setCrossPostTo(prev =>
      prev.includes(platformValue)
        ? prev.filter(p => p !== platformValue)
        : [...prev, platformValue]
    );
  };

  const toggleAllCrossPosts = () => {
    const allPlatforms = platforms
      .map(p => p.value as Platform)
      .filter(p => p !== platform);
    
    const allSelected = allPlatforms.every(p => crossPostTo.includes(p));
    setCrossPostTo(allSelected ? [] : allPlatforms);
  };

  const handleSave = () => {
    if (onSave) {
      // Convert 24hr time to 12hr format for consistency
      const convert24To12Hour = (time24: string) => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(':');
        let hour = parseInt(hours);
        const period = hour >= 12 ? 'PM' : 'AM';
        
        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;
        
        return `${hour}:${minutes} ${period}`;
      };

      onSave({
        content,
        platform,
        time: convert24To12Hour(time),
        date,
        attachments,
        crossPostTo,
        recurrence: { frequency: recurrenceFrequency },
      });
    }
  };

  const formatDateForInput = (date: Date) => {
    // Handle invalid dates
    if (!date || isNaN(date.getTime())) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label>Content</Label>
            <Textarea
              placeholder="What do you want to share with your audience?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-2 min-h-[200px] resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">{content.length} characters</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={generateWithAI}
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Platform</Label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="mt-2 w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
              >
                {platforms.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Scheduled Date</Label>
              <div className="mt-2 relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={formatDateForInput(date)}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Scheduled Time</Label>
              <div className="mt-2 relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Recurrence</Label>
              <select
                value={recurrenceFrequency}
                onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                className="mt-2 w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Repeats daily</option>
                <option value="weekly">Repeats weekly</option>
                <option value="monthly">Repeats monthly</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Cross-post to Other Platforms</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={
                    platforms
                      .filter(p => p.value !== platform)
                      .every(p => crossPostTo.includes(p.value as Platform))
                  }
                  onCheckedChange={toggleAllCrossPosts}
                />
                <span className="text-xs text-muted-foreground">Select All</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 border border-border rounded-lg bg-muted/20">
              {platforms
                .filter(p => p.value !== platform)
                .map((p) => (
                  <label 
                    key={p.value}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={crossPostTo.includes(p.value as Platform)}
                      onCheckedChange={() => toggleCrossPost(p.value as Platform)}
                    />
                    <PlatformIcon platform={p.value} className="w-4 h-4" />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
            </div>
            {crossPostTo.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                This post will be automatically published to {crossPostTo.length} additional platform{crossPostTo.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleFileAttachment}
              className="hover:bg-emerald-500/5 hover:border-emerald-500/30"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Add Files
            </Button>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Attachments ({attachments.length})</Label>
              {attachments.map((attachment, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50"
                >
                  <Paperclip className="w-4 h-4 text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(attachment.size / 1024).toFixed(1)}KB
                    </p>
                  </div>
                  <button
                    onClick={() => removeAttachment(attachment.name)}
                    className="p-1 hover:bg-destructive/10 rounded transition-colors"
                    title="Remove attachment"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {showActions && (
        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="min-w-[120px]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="min-w-[120px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
          >
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
