import { Card } from "../ui/card";
import { CalendarPostCard } from "./CalendarPostCard";
import type { ScheduledPost } from "../../types";

interface CalendarDayDetailProps {
  selectedDate: Date | null;
  posts: ScheduledPost[];
  onEditPost: (post: ScheduledPost) => void;
  onDeletePost: (postId: string) => void;
  onRemoveAttachment: (postId: string, attachmentName: string) => void;
}

export function CalendarDayDetail({
  selectedDate,
  posts,
  onEditPost,
  onDeletePost,
  onRemoveAttachment,
}: CalendarDayDetailProps) {
  return (
    <Card className="p-6">
      <h3 className="mb-4">
        {selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
      </h3>
      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map(post => (
            <CalendarPostCard
              key={post.id}
              post={post}
              onEdit={onEditPost}
              onDelete={onDeletePost}
              onRemoveAttachment={onRemoveAttachment}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No posts scheduled for this day</p>
          <p className="text-muted-foreground text-xs mt-1">Click "Schedule Post" to add content</p>
        </div>
      )}
    </Card>
  );
}
