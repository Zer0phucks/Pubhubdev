import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { PlatformIcon } from "./PlatformIcon";
import { AutomationSettings } from "./AutomationSettings";
import { Templates } from "./Templates";
import { ProjectManagement } from "./ProjectManagement";
import { 
  Link2, 
  Check, 
  X, 
  Settings as SettingsIcon,
  Keyboard,
  Bell,
  Palette,
  Shield,
  Zap,
  Command as CommandKey,
  AlertCircle,
  Workflow
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

type Platform = "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface PlatformConnection {
  platform: Platform;
  name: string;
  connected: boolean;
  username?: string;
  lastSync?: Date;
  description: string;
}

interface KeyboardShortcut {
  category: string;
  shortcuts: {
    keys: string;
    description: string;
  }[];
}

export type SettingsTab = "connections" | "automation" | "shortcuts" | "preferences" | "notifications" | "templates" | "projects";

interface SettingsProps {
  initialTab?: SettingsTab;
}

export function Settings({ initialTab = "connections" }: SettingsProps = {}) {
  const [connections, setConnections] = useState<PlatformConnection[]>([
    {
      platform: "twitter",
      name: "Twitter",
      connected: true,
      username: "@yourhandle",
      lastSync: new Date(Date.now() - 2 * 60 * 1000),
      description: "Share updates and engage with your audience in real-time"
    },
    {
      platform: "instagram",
      name: "Instagram",
      connected: true,
      username: "@yourprofile",
      lastSync: new Date(Date.now() - 15 * 60 * 1000),
      description: "Post photos, stories, and reels to showcase your visual content"
    },
    {
      platform: "linkedin",
      name: "LinkedIn",
      connected: false,
      description: "Share professional insights and network with industry leaders"
    },
    {
      platform: "facebook",
      name: "Facebook",
      connected: true,
      username: "Your Page",
      lastSync: new Date(Date.now() - 45 * 60 * 1000),
      description: "Connect with your community and share updates on your Page"
    },
    {
      platform: "youtube",
      name: "YouTube",
      connected: false,
      description: "Upload and manage video content for your channel"
    },
    {
      platform: "tiktok",
      name: "TikTok",
      connected: false,
      description: "Create and share short-form video content"
    },
    {
      platform: "pinterest",
      name: "Pinterest",
      connected: false,
      description: "Pin images and ideas to boards and inspire your audience"
    },
    {
      platform: "reddit",
      name: "Reddit",
      connected: false,
      description: "Engage with communities and share content on subreddits"
    },
    {
      platform: "blog",
      name: "Blog",
      connected: false,
      description: "Publish articles and posts to your WordPress, Medium, or custom blog"
    }
  ]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      category: "Navigation",
      shortcuts: [
        { keys: "⌘H", description: "Go to Home" },
        { keys: "⌘N", description: "Create New Post" },
        { keys: "⌘I", description: "Open Inbox" },
        { keys: "⌘C", description: "Open Calendar" },
        { keys: "⌘S", description: "Open Settings" },
      ]
    },
    {
      category: "AI & Tools",
      shortcuts: [
        { keys: "⌘K", description: "Open AI Chat Assistant" },
        { keys: "⌘⇧K", description: "Open Command Palette" },
        { keys: "⌘,", description: "Open Quick Settings" },
      ]
    },
    {
      category: "Content Actions",
      shortcuts: [
        { keys: "⌘↵", description: "Publish/Schedule Post" },
        { keys: "⌘S", description: "Save Draft" },
        { keys: "ESC", description: "Close Dialog/Cancel" },
      ]
    }
  ];

  const toggleConnection = (platform: Platform) => {
    setConnections(prev =>
      prev.map(conn =>
        conn.platform === platform
          ? { ...conn, connected: !conn.connected }
          : conn
      )
    );
  };

  const getTimeSinceSync = (date?: Date) => {
    if (!date) return null;
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getSectionTitle = () => {
    switch (initialTab) {
      case "connections":
        return { title: "Platform Connections", description: "Connect and manage your social media accounts" };
      case "automation":
        return { title: "Automation Rules", description: "Set up automated content transformation workflows" };
      case "templates":
        return { title: "Templates", description: "Create and manage reusable content templates" };
      case "projects":
        return { title: "Projects", description: "Manage your workspaces and campaigns" };
      case "shortcuts":
        return { title: "Keyboard Shortcuts", description: "Learn and customize keyboard shortcuts" };
      case "preferences":
        return { title: "Preferences", description: "Customize your PubHub experience" };
      case "notifications":
        return { title: "Notifications", description: "Manage your notification preferences" };
      default:
        return { title: "Settings", description: "Manage your platform connections, preferences, and shortcuts" };
    }
  };

  const sectionInfo = getSectionTitle();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-emerald-400 mb-2">{sectionInfo.title}</h2>
        <p className="text-muted-foreground">
          {sectionInfo.description}
        </p>
      </div>

      {/* Platform Connections */}
      {initialTab === "connections" && (
        <div className="space-y-4">
          <Alert className="border-emerald-500/30 bg-emerald-500/10">
            <Zap className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-200">
              Connect your social media accounts to start publishing across all platforms from one place.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            {connections.map((connection) => (
              <Card key={connection.platform} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                      <PlatformIcon 
                        platform={connection.platform} 
                        className="w-6 h-6" 
                        size={24} 
                      />
                    </div>
                    <div>
                      <h3 className="text-base">{connection.name}</h3>
                      {connection.connected && connection.username && (
                        <p className="text-sm text-muted-foreground">{connection.username}</p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={connection.connected ? "default" : "outline"}
                    className={connection.connected 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "border-border/50"
                    }
                  >
                    {connection.connected ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        Disconnected
                      </>
                    )}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {connection.description}
                </p>

                {connection.connected && connection.lastSync && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Last synced: {getTimeSinceSync(connection.lastSync)}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant={connection.connected ? "outline" : "default"}
                    className={connection.connected 
                      ? "flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50" 
                      : "flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                    }
                    onClick={() => toggleConnection(connection.platform)}
                  >
                    {connection.connected ? "Disconnect" : "Connect"}
                  </Button>
                  {connection.connected && (
                    <Button variant="outline" className="hover:bg-emerald-500/10 hover:border-emerald-500/30">
                      Sync
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Automation */}
      {initialTab === "automation" && (
        <AutomationSettings />
      )}

      {/* Keyboard Shortcuts */}
      {initialTab === "shortcuts" && (
        <div className="space-y-6">
          <Alert className="border-purple-500/30 bg-purple-500/10">
            <Keyboard className="h-4 w-4 text-purple-400" />
            <AlertDescription className="text-purple-200">
              Use keyboard shortcuts to navigate PubHub faster. Press <kbd className="px-2 py-0.5 bg-muted rounded text-xs">⌘K</kbd> to open AI chat or <kbd className="px-2 py-0.5 bg-muted rounded text-xs">⌘⇧K</kbd> for the command palette.
            </AlertDescription>
          </Alert>

          {keyboardShortcuts.map((category, idx) => (
            <Card key={idx} className="p-6">
              <h3 className="mb-4 text-emerald-400">{category.category}</h3>
              <div className="space-y-3">
                {category.shortcuts.map((shortcut, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <kbd className="px-3 py-1.5 bg-muted/50 border border-border rounded text-xs font-mono">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
              {idx < keyboardShortcuts.length - 1 && <Separator className="mt-4" />}
            </Card>
          ))}

          <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm mb-1">Platform-specific keys</h4>
                <p className="text-sm text-muted-foreground">
                  On Mac, use <CommandKey className="w-3 h-3 inline" /> Command. On Windows/Linux, use Ctrl instead.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Preferences */}
      {initialTab === "preferences" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-emerald-400">Appearance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme across the application
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-emerald-400">Content</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-schedule" className="text-base">AI Auto-Schedule</Label>
                  <p className="text-sm text-muted-foreground">
                    Let AI suggest optimal posting times automatically
                  </p>
                </div>
                <Switch
                  id="auto-schedule"
                  checked={autoSchedule}
                  onCheckedChange={setAutoSchedule}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-emerald-400">Account</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  placeholder="Your Name"
                  defaultValue="Content Creator"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  defaultValue="creator@pubhub.app"
                  className="mt-2"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {initialTab === "notifications" && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-emerald-400">Push Notifications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive alerts about your content performance
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-comments">New Comments</Label>
                <Switch id="new-comments" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="new-messages">New Messages</Label>
                <Switch id="new-messages" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="mentions">Mentions</Label>
                <Switch id="mentions" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="post-published">Post Published</Label>
                <Switch id="post-published" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-report">Weekly Performance Report</Label>
                <Switch id="weekly-report" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-emerald-400">Email Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-digest">Daily Digest</Label>
                <Switch id="email-digest" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-marketing">Marketing Updates</Label>
                <Switch id="email-marketing" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Templates */}
      {initialTab === "templates" && (
        <Templates />
      )}

      {/* Projects */}
      {initialTab === "projects" && (
        <ProjectManagement />
      )}
    </div>
  );
}
