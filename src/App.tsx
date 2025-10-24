import { useState, useEffect } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./components/ui/collapsible";
import { 
  LayoutDashboard, 
  PenSquare, 
  Inbox, 
  Calendar, 
  Settings as SettingsIcon,
  ChevronDown,
  Mail,
  MessageSquare,
  MessageCircle,
  Video,
  Link2,
  Workflow,
  Keyboard,
  Bell,
  Palette,
  BarChart3,
  FileText,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import { Home } from "./components/Home";
import { ContentComposer } from "./components/ContentComposer";
import { UnifiedInbox } from "./components/UnifiedInbox";
import { ContentCalendar } from "./components/ContentCalendar";
import { Analytics } from "./components/Analytics";
import { Settings, SettingsTab } from "./components/Settings";
import { MediaLibrary } from "./components/MediaLibrary";
import { Notifications } from "./components/Notifications";
import { PubHubLogo } from "./components/PubHubLogo";
import { AppHeader } from "./components/AppHeader";
import { CommandPalette } from "./components/CommandPalette";
import { SettingsPanel } from "./components/SettingsPanel";
import { AIChatDialog } from "./components/AIChatDialog";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ProjectProvider } from "./components/ProjectContext";
import { ProjectSwitcher } from "./components/ProjectSwitcher";
import { AuthPage } from "./components/AuthPage";
import { Landing } from "./components/Landing";
import { Toaster } from "./components/ui/sonner";
import { TransformedContent } from "./utils/contentTransformer";

type View = "home" | "compose" | "inbox" | "calendar" | "analytics" | "library" | "notifications" | "settings";
type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";
type InboxView = "all" | "unread" | "comments" | "messages";

interface RemixContent {
  id: string;
  platform: string;
  title: string;
  description: string;
  thumbnail: string;
  type: string;
}

function AppContent() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("all");
  const [inboxView, setInboxView] = useState<InboxView>("unread");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("connections");
  const [inboxOpen, setInboxOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiChatOpen, setAIChatOpen] = useState(false);
  const [transformedContent, setTransformedContent] = useState<TransformedContent | null>(null);
  const [remixContent, setRemixContent] = useState<RemixContent | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const { user, loading, isAuthenticated } = useAuth();

  // Apply theme and set document title
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    document.title = 'PubHub - Creator Platform';
    
    // Add favicon
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'icon';
    link.href = '/public/favicon.svg';
    document.head.appendChild(link);
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for AI chat
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAIChatOpen(true);
      }
      // Cmd/Ctrl + Shift + K for command palette
      if (e.key === "k" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Cmd/Ctrl + , for settings panel
      if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSettingsPanelOpen(true);
      }
      // Cmd/Ctrl + N for new post
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCurrentView("compose");
      }
      // Cmd/Ctrl + H for home
      if (e.key === "h" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCurrentView("home");
      }
      // Cmd/Ctrl + I for inbox
      if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCurrentView("inbox");
      }
      // Cmd/Ctrl + C for calendar (unless copying)
      if (e.key === "c" && (e.metaKey || e.ctrlKey) && !e.shiftKey && e.target === document.body) {
        e.preventDefault();
        setCurrentView("calendar");
      }
      // Cmd/Ctrl + A for analytics
      if (e.key === "a" && (e.metaKey || e.ctrlKey) && e.target === document.body) {
        e.preventDefault();
        setCurrentView("analytics");
      }
      // Cmd/Ctrl + M for remix
      if (e.key === "m" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCurrentView("library");
      }
      // Cmd/Ctrl + B for notifications (Bell)
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCurrentView("notifications");
      }
      // Cmd/Ctrl + S for settings
      if (e.key === "s" && (e.metaKey || e.ctrlKey) && e.target === document.body) {
        e.preventDefault();
        setCurrentView("settings");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const menuItems = [
    { id: "home" as View, label: "Home", icon: LayoutDashboard },
    { id: "inbox" as View, label: "Inbox", icon: Inbox },
    { id: "calendar" as View, label: "Calendar", icon: Calendar },
    { id: "analytics" as View, label: "Analytics", icon: BarChart3 },
    { id: "library" as View, label: "Remix", icon: Video },
    { id: "settings" as View, label: "Settings", icon: SettingsIcon },
  ];

  const handleNavigate = (view: View, subView?: InboxView | SettingsTab) => {
    setCurrentView(view);
    if (view === "inbox") {
      setInboxOpen(true);
      if (subView && typeof subView === "string" && ["all", "unread", "comments", "messages"].includes(subView)) {
        setInboxView(subView as InboxView);
      }
    } else if (view === "settings") {
      setSettingsOpen(true);
      if (subView && typeof subView === "string") {
        setSettingsTab(subView as SettingsTab);
      }
    }
  };

  const handleInboxViewChange = (view: InboxView) => {
    setInboxView(view);
    setCurrentView("inbox");
  };

  const handleSettingsTabChange = (tab: SettingsTab) => {
    setSettingsTab(tab);
    setCurrentView("settings");
  };

  const handlePlatformChange = (platform: Platform) => {
    setSelectedPlatform(platform);
    // Platform selection works on home, compose, calendar, and inbox views
  };

  const handleContentTransformation = (content: TransformedContent) => {
    setTransformedContent(content);
    setCurrentView("compose");
  };

  const handleRemixContent = (content: RemixContent) => {
    setRemixContent(content);
    setCurrentView("compose");
  };

  const renderContent = () => {
    switch (currentView) {
      case "home":
        return <Home selectedPlatform={selectedPlatform} />;
      case "compose":
        return (
          <ContentComposer 
            transformedContent={transformedContent}
            remixContent={remixContent}
            onContentUsed={() => {
              setTransformedContent(null);
              setRemixContent(null);
            }}
          />
        );
      case "inbox":
        return <UnifiedInbox inboxView={inboxView} selectedPlatform={selectedPlatform} />;
      case "calendar":
        return <ContentCalendar selectedPlatform={selectedPlatform} />;
      case "analytics":
        return <Analytics selectedPlatform={selectedPlatform} />;
      case "library":
        return (
          <MediaLibrary 
            selectedPlatform={selectedPlatform as any}
            onRemix={handleRemixContent}
          />
        );
      case "notifications":
        return (
          <Notifications 
            onOpenSettings={() => {
              setCurrentView("settings");
              setSettingsTab("notifications");
              setSettingsOpen(true);
            }}
          />
        );
      case "settings":
        return <Settings initialTab={settingsTab} />;
      default:
        return <Home selectedPlatform={selectedPlatform} />;
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PubHubLogo className="h-16 w-auto mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page or auth page if not authenticated
  if (!isAuthenticated) {
    if (showLanding) {
      return <Landing onGetStarted={() => setShowLanding(false)} />;
    }
    return <AuthPage />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="none" className="fixed left-0 top-0 h-screen z-20">
          <SidebarHeader className="border-b border-sidebar-border px-4 h-[53px] flex items-center">
            <PubHubLogo className="h-12 w-auto" />
          </SidebarHeader>

          <SidebarContent className="px-3 pt-3 overflow-hidden flex flex-col">
            {/* Project Switcher */}
            <div className="pb-3">
              <ProjectSwitcher />
            </div>
            <SidebarMenu className="gap-0.5 flex-1">
              {menuItems.map((item) => {
                if (item.id === "inbox") {
                  return (
                    <Collapsible
                      key={item.id}
                      open={inboxOpen}
                      onOpenChange={setInboxOpen}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => handleNavigate(item.id)}
                            isActive={currentView === item.id}
                            className="w-full"
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                            <ChevronDown className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "inbox" && inboxView === "all"}
                              >
                                <button onClick={() => handleInboxViewChange("all")}>
                                  <Inbox className="w-4 h-4" />
                                  <span>All</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "inbox" && inboxView === "unread"}
                              >
                                <button onClick={() => handleInboxViewChange("unread")}>
                                  <Mail className="w-4 h-4" />
                                  <span>Unread</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "inbox" && inboxView === "comments"}
                              >
                                <button onClick={() => handleInboxViewChange("comments")}>
                                  <MessageSquare className="w-4 h-4" />
                                  <span>Comments</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "inbox" && inboxView === "messages"}
                              >
                                <button onClick={() => handleInboxViewChange("messages")}>
                                  <MessageCircle className="w-4 h-4" />
                                  <span>Messages</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                if (item.id === "settings") {
                  return (
                    <Collapsible
                      key={item.id}
                      open={settingsOpen}
                      onOpenChange={setSettingsOpen}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => handleNavigate(item.id)}
                            isActive={currentView === item.id}
                            className="w-full"
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                            <ChevronDown className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "settings" && settingsTab === "connections"}
                              >
                                <button onClick={() => handleSettingsTabChange("connections")}>
                                  <Link2 className="w-4 h-4" />
                                  <span>Connections</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "settings" && settingsTab === "automation"}
                              >
                                <button onClick={() => handleSettingsTabChange("automation")}>
                                  <Workflow className="w-4 h-4" />
                                  <span>Automation</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "settings" && settingsTab === "shortcuts"}
                              >
                                <button onClick={() => handleSettingsTabChange("shortcuts")}>
                                  <Keyboard className="w-4 h-4" />
                                  <span>Shortcuts</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "settings" && settingsTab === "preferences"}
                              >
                                <button onClick={() => handleSettingsTabChange("preferences")}>
                                  <Palette className="w-4 h-4" />
                                  <span>Preferences</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "settings" && settingsTab === "notifications"}
                              >
                                <button onClick={() => handleSettingsTabChange("notifications")}>
                                  <Bell className="w-4 h-4" />
                                  <span>Notifications</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "settings" && settingsTab === "templates"}
                              >
                                <button onClick={() => handleSettingsTabChange("templates")}>
                                  <FileText className="w-4 h-4" />
                                  <span>Templates</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "settings" && settingsTab === "projects"}
                              >
                                <button onClick={() => handleSettingsTabChange("projects")}>
                                  <FolderOpen className="w-4 h-4" />
                                  <span>Projects</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigate(item.id)}
                      isActive={currentView === item.id}
                      className="w-full"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            
            {/* Create Post Button */}
            <div className="px-1 pt-3 pb-3 mt-auto">
              <button
                onClick={() => handleNavigate("compose")}
                className="w-full h-10 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all flex items-center justify-center gap-2"
              >
                <PenSquare className="w-4 h-4" />
                <span>Create Post</span>
              </button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 ml-[var(--sidebar-width)]">
          <AppHeader
            currentView={currentView}
            selectedPlatform={selectedPlatform}
            onPlatformChange={handlePlatformChange}
            onNavigate={handleNavigate}
            onOpenSettings={() => setSettingsPanelOpen(true)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenAIChat={(query) => {
              setAIChatOpen(true);
              // You can pass the query to the AI chat dialog if needed
            }}
          />

          <div className="flex-1 px-6 py-6 overflow-auto">
            {renderContent()}
          </div>
        </main>

        {/* AI Chat Dialog */}
        <AIChatDialog
          open={aiChatOpen}
          onOpenChange={setAIChatOpen}
          currentView={currentView}
          selectedPlatform={selectedPlatform}
        />

        {/* Command Palette */}
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          onNavigate={handleNavigate}
          onPlatformSelect={handlePlatformChange}
          onOpenSettings={() => setSettingsPanelOpen(true)}
        />

        {/* Settings Panel */}
        <SettingsPanel
          open={settingsPanelOpen}
          onOpenChange={setSettingsPanelOpen}
          theme={theme}
          onThemeChange={setTheme}
        />

        {/* Toast Notifications */}
        <Toaster />
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppContent />
      </ProjectProvider>
    </AuthProvider>
  );
}
