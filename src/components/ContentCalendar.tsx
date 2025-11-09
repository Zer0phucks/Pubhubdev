import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { PostEditor } from "./PostEditor";
import { CalendarMonthView } from "./calendar/CalendarMonthView";
import { CalendarWeekView } from "./calendar/CalendarWeekView";
import { CalendarDayDetail } from "./calendar/CalendarDayDetail";
import { ConfirmDialog } from "./ConfirmDialog";
import { postsAPI } from "../utils/api";
import { toast } from "sonner";
import { useProject } from "./ProjectContext";
import { logger } from "../utils/logger";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  CalendarDays,
  CalendarRange,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { Platform, PlatformFilter, ScheduledPost, PostStatus } from "../types";

interface ContentCalendarProps {
  selectedPlatform?: PlatformFilter;
}

export function ContentCalendar({ selectedPlatform = "all" }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    "twitter", "instagram", "linkedin", "facebook", "youtube", "tiktok", "pinterest", "reddit", "blog"
  ]);
  const [selectedStatuses, setSelectedStatuses] = useState<PostStatus[]>(["draft", "scheduled", "published"]);
  const [showAiPosts, setShowAiPosts] = useState<boolean>(true);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<ScheduledPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const { currentProject } = useProject();

  // Load posts from backend when project changes
  useEffect(() => {
    if (currentProject) {
      loadPosts();
    }
  }, [currentProject?.id]);

  const loadPosts = async () => {
    if (!currentProject) return;
    
    try {
      setLoading(true);
      const { posts } = await postsAPI.getAll({ projectId: currentProject.id });
      
      // Convert backend posts to ScheduledPost format
      const convertedPosts: ScheduledPost[] = posts.map((post: any) => {
        const scheduledDate = post.scheduledFor ? new Date(post.scheduledFor) : 
                             post.publishedAt ? new Date(post.publishedAt) : new Date();
        
        // Extract time from the date
        const time = scheduledDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });

        return {
          id: post.id,
          date: scheduledDate,
          time: time,
          platform: post.platforms[0] as Platform, // Primary platform
          content: post.content,
          status: post.status as PostStatus,
          attachments: post.attachments,
          crossPostTo: post.platforms.slice(1) as Platform[], // Additional platforms
          recurrence: post.recurrence,
        };
      });

      setScheduledPosts(convertedPosts);
    } catch (error) {
      logger.error('Failed to load posts', error);
      toast.error('Failed to load posts from server');
    } finally {
      setLoading(false);
    }
  };

  // Demo posts removed - all posts now come from backend

  const platforms: { value: Platform; label: string }[] = [
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


  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setIsEditDialogOpen(true);
  };

  const handleSavePost = async (data: {
    content: string;
    platform: string;
    time: string;
    date: Date;
    attachments: { name: string; size: number; type: string }[];
    crossPostTo?: Platform[];
  }) => {
    if (editingPost) {
      try {
        setSaving(true);
        
        // Combine date and time with validation
        const scheduledDateTime = new Date(data.date);
        
        // Validate date
        if (isNaN(scheduledDateTime.getTime())) {
          throw new Error('Invalid date provided');
        }
        
        const [timeStr, meridiem] = data.time.split(' ');
        if (!timeStr || !meridiem) {
          throw new Error('Invalid time format');
        }
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          throw new Error('Invalid time values');
        }
        
        let hour = hours;
        if (meridiem === 'PM' && hour !== 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;
        scheduledDateTime.setHours(hour, minutes, 0, 0);

        // Build platforms array
        const platforms = [data.platform as Platform, ...(data.crossPostTo || [])];

        // Update in backend
        await postsAPI.update(editingPost.id, {
          platforms,
          content: data.content,
          scheduledFor: scheduledDateTime.toISOString(),
          attachments: data.attachments,
        });

        // Update local state
        setScheduledPosts(prev =>
          prev.map(post =>
            post.id === editingPost.id
              ? {
                  ...post,
                  content: data.content,
                  platform: data.platform as Platform,
                  time: data.time,
                  date: data.date,
                  attachments: data.attachments,
                  crossPostTo: data.crossPostTo,
                }
              : post
          )
        );
        
        toast.success('Post updated successfully');
        setIsEditDialogOpen(false);
        setEditingPost(null);
      } catch (error: any) {
        logger.error('Failed to update post', error);
        toast.error('Failed to update post', {
          description: error.message || 'Please try again'
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteClick = (postId: string) => {
    const post = scheduledPosts.find(p => p.id === postId);
    if (post) {
      setPostToDelete(post);
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (postToDelete) {
      try {
        setSaving(true);
        await postsAPI.delete(postToDelete.id);
        setScheduledPosts(prev => prev.filter(post => post.id !== postToDelete.id));
        toast.success("Post deleted successfully");
      } catch (error: any) {
        logger.error('Failed to delete post', error);
        toast.error('Failed to delete post', {
          description: error.message || 'Please try again'
        });
      } finally {
        setSaving(false);
      }
    }
    setPostToDelete(null);
  };

  const handleCreatePost = async (data: {
    content: string;
    platform: string;
    time: string;
    date: Date;
    attachments: { name: string; size: number; type: string }[];
    crossPostTo?: Platform[];
    recurrence?: { frequency: "none" | "daily" | "weekly" | "monthly" };
  }) => {
    try {
      setSaving(true);
      
      // Combine date and time with validation
      const scheduledDateTime = new Date(data.date);
      
      // Validate date
      if (isNaN(scheduledDateTime.getTime())) {
        throw new Error('Invalid date provided');
      }
      
      const [timeStr, meridiem] = data.time.split(' ');
      if (!timeStr || !meridiem) {
        throw new Error('Invalid time format');
      }
      
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Invalid time values');
      }
      
      let hour = hours;
      if (meridiem === 'PM' && hour !== 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;
      scheduledDateTime.setHours(hour, minutes, 0, 0);

      // Build platforms array
      const platforms = [data.platform as Platform, ...(data.crossPostTo || [])];

      // Create in backend
      const { post } = await postsAPI.create({
        projectId: currentProject.id,
        platforms,
        content: data.content,
        status: 'scheduled',
        scheduledFor: scheduledDateTime.toISOString(),
        attachments: data.attachments,
        recurrence: data.recurrence,
      });

      // Add to local state
      const newPost: ScheduledPost = {
        id: post.id,
        content: data.content,
        platform: data.platform as Platform,
        time: data.time,
        date: data.date,
        status: "scheduled",
        attachments: data.attachments,
        crossPostTo: data.crossPostTo,
        recurrence: data.recurrence,
      };
      
      setScheduledPosts([...scheduledPosts, newPost]);
      toast.success('Post scheduled successfully');
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      logger.error('Failed to create post', error);
      toast.error('Failed to schedule post', {
        description: error.message || 'Please try again'
      });
    } finally {
      setSaving(false);
    }
  };

  const removeAttachment = (postId: string, attachmentName: string) => {
    setScheduledPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { 
              ...post, 
              attachments: post.attachments?.filter(a => a.name !== attachmentName) 
            }
          : post
      )
    );
  };

  const toggleStatus = (status: PostStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const filteredPosts = scheduledPosts.filter(post => {
    // Filter by the prop from parent (platform tabs)
    const propPlatformMatch = selectedPlatform === "all" || post.platform === selectedPlatform;
    // Filter by local platform checkboxes
    const localPlatformMatch = selectedPlatforms.includes(post.platform);
    // Filter by status checkboxes
    const statusMatch = selectedStatuses.includes(post.status);
    // Filter by AI toggle
    const aiMatch = showAiPosts || !post.isAiGenerated;
    
    return propPlatformMatch && localPlatformMatch && statusMatch && aiMatch;
  });

  const postsForDate = (date: Date) => {
    return filteredPosts.filter(post => 
      post.date.toDateString() === date.toDateString()
    );
  };

  const previousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const previousPeriod = () => {
    if (view === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (view === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return [startOfWeek];
  };

  const selectedDatePosts = selectedDate ? postsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
          <p className="text-muted-foreground">Loading your content calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Indicator */}
      {!currentProject && (
        <Alert className="border-yellow-500/30 bg-yellow-500/10">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <AlertDescription className="text-yellow-400">
            No project selected. Please select a project from the sidebar to view your calendar.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-emerald-400">Content Calendar</h2>
          {saving && (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadPosts}
            variant="outline"
            size="sm"
            className="hover:bg-emerald-500/10 hover:border-emerald-500/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-emerald-400">
                {view === "month" 
                  ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : `Week of ${getWeekDays(currentDate)[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                }
              </h3>
              <div className="flex gap-2">
                <div className="flex gap-1 mr-2 bg-muted/30 rounded-lg p-1">
                  <Button 
                    variant={view === "month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("month")}
                    className={view === "month" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                  >
                    <CalendarDays className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={view === "week" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("week")}
                    className={view === "week" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                  >
                    <CalendarRange className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={previousPeriod}
                  className="hover:bg-emerald-500/10 hover:border-emerald-500/30"
                  title={view === "month" ? "Previous month" : "Previous week"}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={previousDay}
                  className="hover:bg-emerald-500/10 hover:border-emerald-500/30"
                  title="Previous day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToToday}
                  className="hover:bg-emerald-500/10 hover:border-emerald-500/30"
                >
                  Today
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={nextDay}
                  className="hover:bg-emerald-500/10 hover:border-emerald-500/30"
                  title="Next day"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={nextPeriod}
                  className="hover:bg-emerald-500/10 hover:border-emerald-500/30"
                  title={view === "month" ? "Next month" : "Next week"}
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {view === "month" ? (
              <CalendarMonthView
                currentDate={currentDate}
                selectedDate={selectedDate}
                postsForDate={postsForDate}
                onDateSelect={setSelectedDate}
              />
            ) : (
              <CalendarWeekView
                currentDate={currentDate}
                selectedDate={selectedDate}
                postsForDate={postsForDate}
                onDateSelect={setSelectedDate}
              />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <CalendarDayDetail
            selectedDate={selectedDate}
            posts={selectedDatePosts}
            onEditPost={handleEditPost}
            onDeletePost={handleDeleteClick}
            onRemoveAttachment={removeAttachment}
          />

          <Card className="p-6">
            <h3 className="mb-4">Filters</h3>
            
            <div className="space-y-4">
              {/* Status Filters */}
              <div>
                <p className="text-sm mb-3 text-muted-foreground">Status</p>
                <div className="space-y-2">
                  {[
                    { value: "draft" as PostStatus, label: "Draft", color: "text-gray-400" },
                    { value: "scheduled" as PostStatus, label: "Scheduled", color: "text-blue-400" },
                    { value: "published" as PostStatus, label: "Published", color: "text-green-400" },
                  ].map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={selectedStatuses.includes(status.value)}
                        onCheckedChange={() => toggleStatus(status.value)}
                      />
                      <label
                        htmlFor={`status-${status.value}`}
                        className={`text-sm cursor-pointer select-none ${status.color}`}
                      >
                        {status.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Filters */}
              <div className="pt-2 border-t border-border">
                <p className="text-sm mb-3 text-muted-foreground">Platforms</p>
                <div className="space-y-2">
                  {platforms.map((platform) => (
                    <div key={platform.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform.value}
                        checked={selectedPlatforms.includes(platform.value)}
                        onCheckedChange={() => togglePlatform(platform.value)}
                      />
                      <label
                        htmlFor={platform.value}
                        className="text-sm cursor-pointer select-none"
                      >
                        {platform.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Toggle */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-ai" 
                    checked={showAiPosts}
                    onCheckedChange={(checked) => setShowAiPosts(checked as boolean)}
                  />
                  <label
                    htmlFor="show-ai"
                    className="text-sm cursor-pointer select-none"
                  >
                    Show AI-generated posts
                  </label>
                </div>
              </div>

              {/* Stats */}
              <div className="pt-4 border-t border-border">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total posts:</span>
                    <span className="text-foreground">{scheduledPosts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filtered:</span>
                    <span className="text-foreground">{filteredPosts.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Post Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>Edit your scheduled post</DialogDescription>
          </DialogHeader>
          {editingPost && (
            <PostEditor
              initialData={{
                content: editingPost.content,
                platform: editingPost.platform,
                time: editingPost.time,
                date: editingPost.date,
                attachments: editingPost.attachments || [],
                crossPostTo: editingPost.crossPostTo
              }}
              onSave={handleSavePost}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingPost(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>Create a new scheduled post</DialogDescription>
          </DialogHeader>
          <PostEditor
            initialData={{
              content: "",
              platform: "twitter",
              time: "9:00 AM",
              date: selectedDate || new Date(),
              attachments: []
            }}
            onSave={handleCreatePost}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete scheduled post?"
        description={
          postToDelete
            ? `Are you sure you want to delete this ${postToDelete.status} post for ${postToDelete.platform}? This action cannot be undone.`
            : "Are you sure you want to delete this post? This action cannot be undone."
        }
        confirmText="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
