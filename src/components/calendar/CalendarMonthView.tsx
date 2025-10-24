import { Badge } from "../ui/badge";
import { PlatformIcon } from "../PlatformIcon";
import { Sparkles, Paperclip } from "lucide-react";
import type { ScheduledPost } from "../../types";

interface CalendarMonthViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  postsForDate: (date: Date) => ScheduledPost[];
  onDateSelect: (date: Date) => void;
}

export function CalendarMonthView({
  currentDate,
  selectedDate,
  postsForDate,
  onDateSelect,
}: CalendarMonthViewProps) {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = [];
  
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map(day => (
        <div key={day} className="text-center pb-2 border-b border-border">
          <span className="text-sm text-muted-foreground">{day}</span>
        </div>
      ))}

      {days.map((day, index) => {
        if (day === null) {
          return <div key={`empty-${index}`} className="min-h-[140px]" />;
        }

        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayPosts = postsForDate(date);
        const isToday = date.toDateString() === new Date().toDateString();
        const isSelected = selectedDate?.toDateString() === date.toDateString();

        return (
          <div 
            key={day} 
            className={`min-h-[140px] p-2 border border-border rounded-lg cursor-pointer transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 ${
              isSelected ? 'border-emerald-500 bg-emerald-500/10' : ''
            } ${isToday ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
            onClick={() => onDateSelect(date)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isToday ? 'text-emerald-400' : 'text-foreground'}`}>
                {day}
              </span>
              {dayPosts.length > 0 && (
                <Badge variant="outline" className="text-xs h-5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  {dayPosts.length}
                </Badge>
              )}
            </div>

            {/* Platform icons for scheduled posts */}
            <div className="space-y-1.5">
              {dayPosts.slice(0, 4).map(post => (
                <div 
                  key={post.id} 
                  className="flex items-center gap-1.5 p-1.5 rounded bg-card/50 border border-border/50"
                >
                  <div className="flex-shrink-0">
                    <PlatformIcon platform={post.platform} className="w-3.5 h-3.5" size={14} />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <p className="text-xs truncate text-muted-foreground">{post.time}</p>
                    {post.isAiGenerated && (
                      <Sparkles className="w-2.5 h-2.5 text-purple-400 flex-shrink-0" />
                    )}
                    {post.attachments && post.attachments.length > 0 && (
                      <Paperclip className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
              {dayPosts.length > 4 && (
                <div className="text-xs text-center text-emerald-400 pt-0.5">
                  +{dayPosts.length - 4}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
