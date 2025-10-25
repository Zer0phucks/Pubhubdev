import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import { 
  LayoutDashboard, 
  PenSquare, 
  Inbox, 
  Calendar, 
  BarChart3,
  Link,
  Settings,
  Video,
  Bell,
  BookOpen,
} from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";

type View = "home" | "compose" | "inbox" | "calendar" | "analytics" | "library" | "notifications" | "ebooks" | "settings";
type Platform = "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: View) => void;
  onPlatformSelect: (platform: Platform) => void;
  onOpenSettings: () => void;
}

export function CommandPalette({ open, onOpenChange, onNavigate, onPlatformSelect, onOpenSettings }: CommandPaletteProps) {
  // Keyboard listener is now in App.tsx to avoid conflicts

  const pages = [
    { id: "home" as View, label: "Home", icon: LayoutDashboard, shortcut: "⌘H" },
    { id: "inbox" as View, label: "Inbox", icon: Inbox, shortcut: "⌘I" },
    { id: "calendar" as View, label: "Calendar", icon: Calendar, shortcut: "⌘C" },
    { id: "analytics" as View, label: "Analytics", icon: BarChart3, shortcut: "⌘A" },
    { id: "library" as View, label: "Remix", icon: Video, shortcut: "⌘M" },
    { id: "ebooks" as View, label: "Ebook Generator", icon: BookOpen, shortcut: "⌘E" },
    { id: "notifications" as View, label: "Notifications", icon: Bell, shortcut: "⌘B" },
    { id: "settings" as View, label: "Settings", icon: Settings, shortcut: "⌘," },
  ];

  const platforms: { id: Platform; label: string }[] = [
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

  const handleSelect = (callback: () => void) => {
    callback();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Quick navigation (⌘⇧K)..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {pages.map((page) => (
            <CommandItem
              key={page.id}
              onSelect={() => handleSelect(() => onNavigate(page.id))}
            >
              <page.icon className="mr-2 h-4 w-4" />
              <span>{page.label}</span>
              {page.shortcut && (
                <span className="ml-auto text-xs text-muted-foreground">{page.shortcut}</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Platforms">
          {platforms.map((platform) => (
            <CommandItem
              key={platform.id}
              onSelect={() => handleSelect(() => onPlatformSelect(platform.id))}
            >
              <PlatformIcon platform={platform.id} className="mr-2 h-4 w-4" size={16} />
              <span>{platform.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleSelect(() => onOpenSettings())}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <span className="ml-auto text-xs text-muted-foreground">⌘,</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
