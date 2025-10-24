import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { PlatformIcon } from "../PlatformIcon";
import { Sparkles, Paperclip, Link2, Trash2, X } from "lucide-react";
import type { ScheduledPost } from "../../types";

interface CalendarPostCardProps {
  post: ScheduledPost;
  onEdit: (post: ScheduledPost) => void;
  onDelete: (postId: string) => void;
  onRemoveAttachment?: (postId: string, attachmentName: string) => void;
}

export function CalendarPostCard({ 
  post, 
  onEdit, 
  onDelete,
  onRemoveAttachment 
}: CalendarPostCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-green-500/10 text-green-500 border-green-500/30";
      case "published": return "bg-gray-500/10 text-gray-500 border-gray-500/30";
      case "draft": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "failed": return "bg-red-500/10 text-red-500 border-red-500/30";
      default: return "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-4 border border-border rounded-lg hover:border-emerald-500/30 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0">
          <PlatformIcon platform={post.platform} className="w-5 h-5" size={20} />
        </div>
        <Badge variant="outline" className="capitalize">
          {post.platform}
        </Badge>
        <Badge className={getStatusColor(post.status)}>
          {post.status}
        </Badge>
        {post.isAiGenerated && (
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            AI
          </Badge>
        )}
      </div>
      
      <p className="text-sm mb-3">{post.content}</p>
      
      {post.attachments && post.attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          {post.attachments.map((attachment, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between p-2 bg-muted/30 border border-border/50 rounded text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{attachment.name}</span>
                <span className="text-muted-foreground flex-shrink-0">
                  ({formatFileSize(attachment.size)})
                </span>
              </div>
              {onRemoveAttachment && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => onRemoveAttachment(post.id, attachment.name)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {post.crossPostTo && post.crossPostTo.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <Link2 className="w-3 h-3 text-cyan-400" />
          <span className="text-xs text-muted-foreground">
            Cross-posting to:
          </span>
          <div className="flex gap-1">
            {post.crossPostTo.map((platform) => (
              <PlatformIcon
                key={platform}
                platform={platform}
                className="w-3.5 h-3.5"
                size={14}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(post)}
          className="flex-1 hover:bg-emerald-500/10 hover:border-emerald-500/30"
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(post.id)}
          className="hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
