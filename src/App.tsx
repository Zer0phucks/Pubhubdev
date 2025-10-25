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
  BookOpen,
  User,
  TrendingUp,
} from "lucide-react";
import { Home } from "./components/Home";
import { ContentComposer } from "./components/ContentComposer";
import { UnifiedInbox } from "./components/UnifiedInbox";
import { ContentCalendar } from "./components/ContentCalendar";
import { Analytics } from "./components/Analytics";
import { AccountSettings, AccountSettingsTab } from "./components/AccountSettings";
import { ProjectSettings, ProjectSettingsTab } from "./components/ProjectSettings";
import { MediaLibrary } from "./components/MediaLibrary";
import { Notifications } from "./components/Notifications";
import { EbookGenerator } from "./components/EbookGenerator";
import { PubHubLogo } from "./components/PubHubLogo";
import { AppHeader } from "./components/AppHeader";
import { CommandPalette } from "./components/CommandPalette";
import { SettingsPanel } from "./components/SettingsPanel";
import { Dialog, DialogContent } from "./components/ui/dialog";
import { AIChatDialog } from "./components/AIChatDialog";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ProjectProvider } from "./components/ProjectContext";
import { ProjectSwitcher } from "./components/ProjectSwitcher";
import { AuthPage } from "./components/AuthPage";
import { Landing } from "./components/Landing";
import { Toaster } from "./components/ui/sonner";
import { TransformedContent } from "./utils/contentTransformer";
import { Trending } from "./components/Trending";
import { OAuthCallback } from "./components/OAuthCallback";

type View = "project-overview" | "compose" | "inbox" | "calendar" | "analytics" | "library" | "notifications" | "ebooks" | "trending" | "project-settings";
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
  const [currentView, setCurrentView] = useState<View>("project-overview");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("all");
  const [inboxView, setInboxView] = useState<InboxView>("unread");
  const [projectSettingsTab, setProjectSettingsTab] = useState<ProjectSettingsTab>("details");
  const [accountSettingsTab, setAccountSettingsTab] = useState<AccountSettingsTab>("profile");
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiChatOpen, setAIChatOpen] = useState(false);
  const [aiInitialQuery, setAIInitialQuery] = useState<string>("");
  const [aiAutoSubmit, setAIAutoSubmit] = useState(false);
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
      // Cmd/Ctrl + H for project overview
      if (e.key === "h" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCurrentView("project-overview");
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
      // Cmd/Ctrl + E for ebooks
      if (e.key === "e" && (e.metaKey || e.ctrlKey) && e.target === document.body) {
        e.preventDefault();
        setCurrentView("ebooks");
      }
      // Cmd/Ctrl + T for trending
      if (e.key === "t" && (e.metaKey || e.ctrlKey) && e.target === document.body) {
        e.preventDefault();
        setCurrentView("trending");
      }
      // Cmd/Ctrl + S for project settings
      if (e.key === "s" && (e.metaKey || e.ctrlKey) && e.target === document.body) {
        e.preventDefault();
        setCurrentView("project-settings");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const menuItems = [
    { id: "project-overview" as View, label: "Project Overview", icon: LayoutDashboard },
    { id: "compose" as View, label: "Compose", icon: PenSquare },
    { id: "inbox" as View, label: "Inbox", icon: Inbox },
    { id: "calendar" as View, label: "Calendar", icon: Calendar },
    { id: "trending" as View, label: "Trending", icon: TrendingUp },
    { id: "analytics" as View, label: "Analytics", icon: BarChart3 },
    { id: "library" as View, label: "Remix", icon: Video },
    { id: "ebooks" as View, label: "Ebooks", icon: BookOpen },
    { id: "project-settings" as View, label: "Project Settings", icon: SettingsIcon },
  ];

  const handleNavigate = (view: View, subView?: InboxView | ProjectSettingsTab) => {
    setCurrentView(view);
    if (view === "inbox") {
      setInboxOpen(true);
      if (subView && typeof subView === "string" && ["all", "unread", "comments", "messages"].includes(subView)) {
        setInboxView(subView as InboxView);
      }
    } else if (view === "project-settings") {
      setSettingsOpen(true);
      if (subView && typeof subView === "string") {
        setProjectSettingsTab(subView as ProjectSettingsTab);
      }
    }
  };

  const handleInboxViewChange = (view: InboxView) => {
    setInboxView(view);
    setCurrentView("inbox");
  };

  const handleProjectSettingsTabChange = (tab: ProjectSettingsTab) => {
    setProjectSettingsTab(tab);
    setCurrentView("project-settings");
  };

  const handleOpenAccountSettings = (tab?: AccountSettingsTab) => {
    if (tab) {
      setAccountSettingsTab(tab);
    }
    setAccountSettingsOpen(true);
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
      case "project-overview":
        return (
          <Home 
            selectedPlatform={selectedPlatform} 
            onNavigate={(view) => setCurrentView(view)}
            onOpenAIChat={(query, autoSubmit) => {
              if (query) setAIInitialQuery(query);
              if (autoSubmit !== undefined) setAIAutoSubmit(autoSubmit);
              setAIChatOpen(true);
            }}
          />
        );
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
              handleOpenAccountSettings("notifications");
            }}
          />
        );
      case "ebooks":
        return <EbookGenerator />;
      case "trending":
        return <Trending selectedPlatform={selectedPlatform} />;
      case "project-settings":
        return <ProjectSettings initialTab={projectSettingsTab} />;
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

  // Check if this is an OAuth callback
  if (window.location.pathname === '/oauth/callback') {
    return <OAuthCallback />;
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

                if (item.id === "project-settings") {
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
                                isActive={currentView === "project-settings" && projectSettingsTab === "details"}
                              >
                                <button onClick={() => handleProjectSettingsTabChange("details")}>
                                  <SettingsIcon className="w-4 h-4" />
                                  <span>Details</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "project-settings" && projectSettingsTab === "connections"}
                              >
                                <button onClick={() => handleProjectSettingsTabChange("connections")}>
                                  <Link2 className="w-4 h-4" />
                                  <span>Connections</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "project-settings" && projectSettingsTab === "automation"}
                              >
                                <button onClick={() => handleProjectSettingsTabChange("automation")}>
                                  <Workflow className="w-4 h-4" />
                                  <span>Automation</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentView === "project-settings" && projectSettingsTab === "templates"}
                              >
                                <button onClick={() => handleProjectSettingsTabChange("templates")}>
                                  <FileText className="w-4 h-4" />
                                  <span>Templates</span>
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
            onOpenAccountSettings={handleOpenAccountSettings}
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
          onOpenChange={(open) => {
            setAIChatOpen(open);
            if (!open) {
              // Reset when closing
              setAIInitialQuery("");
              setAIAutoSubmit(false);
            }
          }}
          currentView={currentView}
          selectedPlatform={selectedPlatform}
          initialQuery={aiInitialQuery}
          autoSubmit={aiAutoSubmit}
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

        {/* Account Settings Dialog */}
        <Dialog open={accountSettingsOpen} onOpenChange={setAccountSettingsOpen}>
          <DialogContent className="max-w-4xl h-[80vh] p-0">
            <AccountSettings 
              initialTab={accountSettingsTab}
              onClose={() => setAccountSettingsOpen(false)}
            />
          </DialogContent>
        </Dialog>

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
