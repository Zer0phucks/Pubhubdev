import { PlatformIcon } from "../PlatformIcon";
import { Sparkles, Paperclip, Link2, RefreshCw } from "lucide-react";
import type { ScheduledPost } from "../../types";

interface CalendarWeekViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  postsForDate: (date: Date) => ScheduledPost[];
  onDateSelect: (date: Date) => void;
}

export function CalendarWeekView({
  currentDate,
  selectedDate,
  postsForDate,
  onDateSelect,
}: CalendarWeekViewProps) {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDates = getWeekDays(currentDate);

  return (
    <div className="grid grid-cols-7 gap-3">
      {weekDates.map((date, index) => {
        const dayPosts = postsForDate(date);
        const isToday = date.toDateString() === new Date().toDateString();
        const isSelected = selectedDate?.toDateString() === date.toDateString();

        return (
          <div 
            key={index}
            className={`border border-border rounded-lg p-3 cursor-pointer transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 ${
              isSelected ? 'border-emerald-500 bg-emerald-500/10' : ''
            } ${isToday ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
            onClick={() => onDateSelect(date)}
          >
            <div className="text-center mb-3 pb-3 border-b border-border">
              <div className="text-sm text-muted-foreground">{weekDays[index]}</div>
              <div className={`text-lg ${isToday ? 'text-emerald-400' : 'text-foreground'}`}>
                {date.getDate()}
              </div>
            </div>

            <div className="space-y-2">
              {dayPosts.map(post => (
                <div 
                  key={post.id}
                  className="flex items-center gap-2 p-2 rounded bg-card/50 border border-border/50"
                >
                  <div className="flex-shrink-0">
                    <PlatformIcon platform={post.platform} className="w-4 h-4" size={16} />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">{post.time}</p>
                    {post.recurrence && post.recurrence.frequency && post.recurrence.frequency !== 'none' && (
                      <RefreshCw className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    )}
                    {post.isAiGenerated && (
                      <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    )}
                    {post.attachments && post.attachments.length > 0 && (
                      <Paperclip className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    )}
                    {post.crossPostTo && post.crossPostTo.length > 0 && (
                      <Link2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
              {dayPosts.length === 0 && (
                <div className="text-xs text-center text-muted-foreground py-4">
                  No posts
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
