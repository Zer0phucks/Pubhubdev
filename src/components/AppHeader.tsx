import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Bell,
  Settings,
  PenSquare,
  Sparkles,
  Command as CommandIcon,
  LogOut,
  Plus,
  User,
  Keyboard,
  Palette,
} from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "./AuthContext";
import { useConnectedPlatforms } from "../hooks/useConnectedPlatforms";
import { logger } from '../utils/logger';

type View = "project-overview" | "compose" | "inbox" | "calendar" | "analytics" | "library" | "notifications" | "ebooks" | "trending" | "competition" | "project-settings";
type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";
type InboxView = "all" | "unread" | "comments" | "messages";
type AccountSettingsTab = "profile" | "shortcuts" | "notifications" | "preferences";
type ProjectSettingsTab = "details" | "connections" | "automation" | "templates";

interface AppHeaderProps {
  currentView: View;
  selectedPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  onNavigate: (view: View, subView?: InboxView | ProjectSettingsTab) => void;
  onOpenAccountSettings: (tab?: AccountSettingsTab) => void;
  onOpenCommandPalette: () => void;
  onOpenAIChat: (query?: string) => void;
}

export function AppHeader({
  currentView,
  selectedPlatform,
  onPlatformChange,
  onNavigate,
  onOpenAccountSettings,
  onOpenCommandPalette,
  onOpenAIChat,
}: AppHeaderProps) {
  const [aiQuery, setAIQuery] = useState("");
  const { user, signout, profilePicture } = useAuth();
  const { connectedPlatforms, hasUnconnectedPlatforms } = useConnectedPlatforms();

  const handleAIQuerySubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onOpenAIChat(aiQuery);
      setAIQuery("");
    }
  };

  const handleSignOut = async () => {
    try {
      await signout();
    } catch (error) {
      logger.error('Sign out error:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = user?.user_metadata?.name || user?.email || 'User';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const allPlatforms: { id: Platform; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "twitter", label: "Twitter" },
    { id: "instagram", label: "Instagram" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "facebook", label: "Facebook" },
    { id: "youtube", label: "YouTube" },
    { id: "tiktok", label: "TikTok" },
    { id: "pinterest", label: "Pinterest" },
    { id: "reddit", label: "Reddit" },
    { id: "blog", label: "Blog" },
  ];

  // Build platform list dynamically based on connected platforms
  const platforms = [
    { id: "all" as Platform, label: "ALL" },
    ...allPlatforms
      .filter(p => p.id !== "all" && connectedPlatforms.includes(p.id as any))
      .map(p => ({ id: p.id, label: p.label }))
  ];

  // Auto-reset to "all" if the selected platform is no longer connected
  useEffect(() => {
    if (selectedPlatform !== "all" && !connectedPlatforms.includes(selectedPlatform as any)) {
      onPlatformChange("all");
    }
  }, [connectedPlatforms, selectedPlatform, onPlatformChange]);

  const getPageTitle = () => {
    switch (currentView) {
      case "project-overview":
        return "Project Overview";
      case "compose":
        return "Create Content";
      case "inbox":
        return "Unified Inbox";
      case "calendar":
        return "Content Calendar";
      case "analytics":
        return "Analytics";
      case "library":
        return "Remix";
      case "trending":
        return "Trending Content";
      case "templates":
        return "Templates";
      case "project-settings":
        return "Project Settings";
      default:
        return "Project Overview";
    }
  };

  const getBreadcrumbs = () => {
    if (currentView === "project-overview" && selectedPlatform !== "all") {
      const platform = allPlatforms.find(p => p.id === selectedPlatform);
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Project Overview</span>
          <span>/</span>
          <span className="text-foreground">{platform?.label}</span>
        </div>
      );
    }
    return null;
  };

  const handleConnectPlatformClick = () => {
    onNavigate("project-settings", "connections");
  };

  // Only show platform tabs on views where filtering by platform makes sense
  const showPlatformSelector = currentView === "project-overview" || currentView === "calendar" || currentView === "inbox" || currentView === "analytics" || currentView === "library" || currentView === "trending";

  return (
    <header className="border-b border-border/50 bg-black/20 backdrop-blur-xl sticky top-0 z-10">
      {/* Combined Row - Platform Tabs and Actions */}
      {showPlatformSelector ? (
        <div className="pl-0 pr-6 overflow-x-auto h-[53px] flex items-center justify-between gap-4">
          <div className="flex items-center">
            <Tabs value={selectedPlatform} onValueChange={onPlatformChange}>
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-0">
                {platforms.map((platform) => (
                  <TabsTrigger
                    key={platform.id}
                    value={platform.id}
                    className="flex items-center gap-2 px-4 h-[53px] data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500/80 data-[state=active]:to-teal-500/50 data-[state=active]:text-white rounded-none data-[state=active]:shadow-none whitespace-nowrap"
                  >
                    {platform.id === "all" ? (
                      <span>{platform.label}</span>
                    ) : (
                      <>
                        <PlatformIcon platform={platform.id} size={18} className="w-[18px] h-[18px]" />
                        <span className="hidden sm:inline">{platform.label}</span>
                      </>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            {/* Connect Platform Button - only show if not all platforms are connected */}
            {hasUnconnectedPlatforms && (
              <button
                onClick={handleConnectPlatformClick}
                className="flex items-center gap-2 px-4 h-[53px] text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors whitespace-nowrap border-b-2 border-transparent"
                title={connectedPlatforms.length === 0 ? "Connect your first platform to get started" : "Connect more platforms"}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Connect Platform</span>
              </button>
            )}
            
            {/* Empty state hint when no platforms connected */}
            {connectedPlatforms.length === 0 && (
              <div className="px-4 h-[53px] flex items-center">
                <span className="text-xs text-muted-foreground">No platforms connected yet</span>
              </div>
            )}
          </div>
          
          {/* Ask PubHub Input */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative group">
              <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border/50 bg-card/50 focus-within:bg-card focus-within:border-emerald-500/50 transition-all">
                <Sparkles className="w-4 h-4 text-emerald-500 group-focus-within:text-emerald-400 transition-colors flex-shrink-0" />
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAIQuery(e.target.value)}
                  onKeyDown={handleAIQuerySubmit}
                  placeholder="Ask PubHub..."
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                />
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground flex-shrink-0">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative">
                  <Avatar className="w-8 h-8">
                    {profilePicture && <AvatarImage src={profilePicture} alt="Profile" />}
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm">{user?.user_metadata?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOpenAccountSettings("profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenAccountSettings("shortcuts")}>
                  <Keyboard className="w-4 h-4 mr-2" />
                  Shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenAccountSettings("notifications")}>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenAccountSettings("preferences")}>
                  <Palette className="w-4 h-4 mr-2" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : (
        <div className="px-6 h-[53px] flex items-center justify-between gap-4">
          {/* Ask PubHub Input */}
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border/50 bg-card/50 focus-within:bg-card focus-within:border-emerald-500/50 transition-all">
                <Sparkles className="w-4 h-4 text-emerald-500 group-focus-within:text-emerald-400 transition-colors flex-shrink-0" />
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAIQuery(e.target.value)}
                  onKeyDown={handleAIQuerySubmit}
                  placeholder="Ask PubHub..."
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                />
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground flex-shrink-0">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative">
                  <Avatar className="w-8 h-8">
                    {profilePicture && <AvatarImage src={profilePicture} alt="Profile" />}
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm">{user?.user_metadata?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOpenAccountSettings("profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenAccountSettings("shortcuts")}>
                  <Keyboard className="w-4 h-4 mr-2" />
                  Shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenAccountSettings("notifications")}>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenAccountSettings("preferences")}>
                  <Palette className="w-4 h-4 mr-2" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </header>
  );
}
