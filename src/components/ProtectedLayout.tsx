import { useState, useEffect, lazy, Suspense } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
} from './ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
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
  BarChart3,
  FileText,
  BookOpen,
  TrendingUp,
  Trophy,
  Loader2,
} from 'lucide-react';
import { PubHubLogo } from './PubHubLogo';
import { AppHeader } from './AppHeader';
import { CommandPalette } from './CommandPalette';
import { SettingsPanel } from './SettingsPanel';
import { Dialog, DialogContent } from './ui/dialog';
import { useAuth } from './AuthContext';
import { ProjectSwitcher } from './ProjectSwitcher';
import { Toaster } from './ui/sonner';
import { TransformedContent } from '../utils/contentTransformer';

const AIChatDialog = lazy(() => import('./AIChatDialog').then(m => ({ default: m.AIChatDialog })));
const AccountSettings = lazy(() => import('./AccountSettings').then(m => ({ default: m.AccountSettings })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";
type InboxView = "all" | "unread" | "comments" | "messages";
type AccountSettingsTab = "profile" | "shortcuts" | "notifications" | "preferences";
type ProjectSettingsTab = "details" | "connections" | "automation" | "templates";

export function ProtectedLayout() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Global state
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(
    (searchParams.get('platform') as Platform) || 'all'
  );
  const [inboxView, setInboxView] = useState<InboxView>('unread');
  const [projectSettingsTab, setProjectSettingsTab] = useState<ProjectSettingsTab>('details');
  const [accountSettingsTab, setAccountSettingsTab] = useState<AccountSettingsTab>('profile');
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    const savedTheme = localStorage.getItem('theme') as "light" | "dark" | "system" | null;
    return savedTheme || "system";
  });
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiChatOpen, setAIChatOpen] = useState(false);
  const [aiInitialQuery, setAIInitialQuery] = useState<string>("");
  const [aiAutoSubmit, setAIAutoSubmit] = useState(false);

  // Apply theme
  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    if (theme === "system") {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemPrefersDark);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handleChange);

      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme]);

  // Persist theme
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Persist platform selection in URL
  useEffect(() => {
    if (selectedPlatform !== 'all') {
      searchParams.set('platform', selectedPlatform);
      setSearchParams(searchParams, { replace: true });
    } else {
      searchParams.delete('platform');
      setSearchParams(searchParams, { replace: true });
    }
  }, [selectedPlatform]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for AI chat
      if (e.key === "k" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
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
        navigate('/compose');
      }
      // Cmd/Ctrl + H for dashboard
      if (e.key === "h" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        navigate('/dashboard');
      }
      // Cmd/Ctrl + I for inbox
      if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        navigate('/inbox');
      }
      // Cmd/Ctrl + C for calendar (unless copying)
      if (e.key === "c" && (e.metaKey || e.ctrlKey) && !e.shiftKey && e.target === document.body) {
        e.preventDefault();
        navigate('/calendar');
      }
      // Cmd/Ctrl + A for analytics
      if (e.key === "a" && (e.metaKey || e.ctrlKey) && e.target === document.body) {
        e.preventDefault();
        navigate('/analytics');
      }
      // Cmd/Ctrl + M for library
      if (e.key === "m" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        navigate('/library');
      }
      // Cmd/Ctrl + E for ebooks
      if (e.key === "e" && (e.metaKey || e.ctrlKey) && e.target === document.body) {
        e.preventDefault();
        navigate('/ebooks');
      }
      // Cmd/Ctrl + T for trending
      if (e.key === "t" && (e.metaKey || e.ctrlKey) && e.target === document.body) {
        e.preventDefault();
        navigate('/trending');
      }
      // Cmd/Ctrl + S for settings
      if (e.key === "s" && (e.metaKey || e.ctrlKey) && e.target === document.body) {
        e.preventDefault();
        navigate('/settings');
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PubHubLogo className="h-16 w-auto mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const menuItems = [
    { path: '/dashboard', label: 'Project Overview', icon: LayoutDashboard },
    { path: '/compose', label: 'Compose', icon: PenSquare },
    { path: '/inbox', label: 'Inbox', icon: Inbox, collapsible: true },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/trending', label: 'Trending', icon: TrendingUp },
    { path: '/competition', label: 'Competition Watch', icon: Trophy },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/library', label: 'Remix', icon: Video },
    { path: '/ebooks', label: 'Ebooks', icon: BookOpen },
    { path: '/settings', label: 'Project Settings', icon: SettingsIcon, collapsible: true },
  ];

  const getCurrentView = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'project-overview';
    if (path.startsWith('/compose')) return 'compose';
    if (path.startsWith('/inbox')) return 'inbox';
    if (path.startsWith('/calendar')) return 'calendar';
    if (path.startsWith('/analytics')) return 'analytics';
    if (path.startsWith('/library')) return 'library';
    if (path.startsWith('/notifications')) return 'notifications';
    if (path.startsWith('/ebooks')) return 'ebooks';
    if (path.startsWith('/trending')) return 'trending';
    if (path.startsWith('/competition')) return 'competition';
    if (path.startsWith('/settings')) return 'project-settings';
    return 'project-overview';
  };

  const handleNavigate = (path: string, subView?: InboxView | ProjectSettingsTab) => {
    navigate(path);
    if (path === '/inbox') {
      setInboxOpen(true);
      if (subView && typeof subView === 'string' && ['all', 'unread', 'comments', 'messages'].includes(subView)) {
        setInboxView(subView as InboxView);
      }
    } else if (path === '/settings') {
      setSettingsOpen(true);
      if (subView && typeof subView === 'string') {
        setProjectSettingsTab(subView as ProjectSettingsTab);
      }
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="fixed left-0 top-0 h-screen z-20">
          <SidebarHeader className="border-b border-sidebar-border px-4 h-[53px] flex items-center justify-center group-hover/sidebar:justify-start">
            <PubHubLogo className="h-12 w-auto group-data-[collapsible=icon]:h-8 group-hover/sidebar:h-12" />
          </SidebarHeader>

          <SidebarContent className="px-3 pt-3 overflow-hidden flex flex-col">
            <div className="pb-3">
              <ProjectSwitcher />
            </div>
            <SidebarMenu className="gap-0.5 flex-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;

                if (item.path === '/inbox' && item.collapsible) {
                  return (
                    <Collapsible
                      key={item.path}
                      open={inboxOpen}
                      onOpenChange={setInboxOpen}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => handleNavigate(item.path)}
                            isActive={isActive}
                            className="w-full"
                            tooltip={item.label}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                            <ChevronDown className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden group-hover/sidebar:inline" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={inboxView === 'all'}>
                                <button onClick={() => { setInboxView('all'); navigate('/inbox'); }}>
                                  <Inbox className="w-4 h-4" />
                                  <span>All</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={inboxView === 'unread'}>
                                <button onClick={() => { setInboxView('unread'); navigate('/inbox'); }}>
                                  <Mail className="w-4 h-4" />
                                  <span>Unread</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={inboxView === 'comments'}>
                                <button onClick={() => { setInboxView('comments'); navigate('/inbox'); }}>
                                  <MessageSquare className="w-4 h-4" />
                                  <span>Comments</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={inboxView === 'messages'}>
                                <button onClick={() => { setInboxView('messages'); navigate('/inbox'); }}>
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

                if (item.path === '/settings' && item.collapsible) {
                  return (
                    <Collapsible
                      key={item.path}
                      open={settingsOpen}
                      onOpenChange={setSettingsOpen}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => handleNavigate(item.path)}
                            isActive={isActive}
                            className="w-full"
                            tooltip={item.label}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                            <ChevronDown className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden group-hover/sidebar:inline" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={projectSettingsTab === 'details'}>
                                <button onClick={() => { setProjectSettingsTab('details'); navigate('/settings'); }}>
                                  <SettingsIcon className="w-4 h-4" />
                                  <span>Details</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={projectSettingsTab === 'connections'}>
                                <button onClick={() => { setProjectSettingsTab('connections'); navigate('/settings'); }}>
                                  <Link2 className="w-4 h-4" />
                                  <span>Connections</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={projectSettingsTab === 'automation'}>
                                <button onClick={() => { setProjectSettingsTab('automation'); navigate('/settings'); }}>
                                  <Workflow className="w-4 h-4" />
                                  <span>Automation</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={projectSettingsTab === 'templates'}>
                                <button onClick={() => { setProjectSettingsTab('templates'); navigate('/settings'); }}>
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
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => handleNavigate(item.path)}
                      isActive={isActive}
                      className="w-full"
                      tooltip={item.label}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            <div className="px-1 pt-3 pb-3 mt-auto">
              <button
                onClick={() => navigate('/compose')}
                className="w-full h-10 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all flex items-center justify-center gap-2 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:px-0 group-hover/sidebar:w-full group-hover/sidebar:px-4"
              >
                <PenSquare className="w-4 h-4" />
                <span className="group-data-[collapsible=icon]:hidden group-hover/sidebar:inline">Create Post</span>
              </button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <AppHeader
            currentView={getCurrentView() as any}
            selectedPlatform={selectedPlatform}
            onPlatformChange={setSelectedPlatform}
            onNavigate={(view, subView) => {
              const pathMap: Record<string, string> = {
                'project-overview': '/dashboard',
                'compose': '/compose',
                'inbox': '/inbox',
                'calendar': '/calendar',
                'analytics': '/analytics',
                'library': '/library',
                'notifications': '/notifications',
                'ebooks': '/ebooks',
                'trending': '/trending',
                'competition': '/competition',
                'project-settings': '/settings',
              };
              handleNavigate(pathMap[view] || '/dashboard', subView);
            }}
            onOpenAccountSettings={(tab) => {
              if (tab) setAccountSettingsTab(tab);
              setAccountSettingsOpen(true);
            }}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenAIChat={(query) => {
              if (query) {
                setAIInitialQuery(query);
                setAIAutoSubmit(true);
              }
              setAIChatOpen(true);
            }}
          />

          <div className="flex-1 px-6 py-6 overflow-auto">
            <Outlet context={{ selectedPlatform, setSelectedPlatform, inboxView, projectSettingsTab }} />
          </div>
        </main>

        {aiChatOpen && (
          <Suspense fallback={null}>
            <AIChatDialog
              open={aiChatOpen}
              onOpenChange={(open) => {
                setAIChatOpen(open);
                if (!open) {
                  setAIInitialQuery("");
                  setAIAutoSubmit(false);
                }
              }}
              currentView={getCurrentView() as any}
              selectedPlatform={selectedPlatform}
              initialQuery={aiInitialQuery}
              autoSubmit={aiAutoSubmit}
            />
          </Suspense>
        )}

        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          onNavigate={(view) => {
            const pathMap: Record<string, string> = {
              'project-overview': '/dashboard',
              'compose': '/compose',
              'inbox': '/inbox',
              'calendar': '/calendar',
              'analytics': '/analytics',
              'library': '/library',
              'notifications': '/notifications',
              'ebooks': '/ebooks',
              'trending': '/trending',
              'project-settings': '/settings',
            };
            navigate(pathMap[view] || '/dashboard');
          }}
          onPlatformSelect={setSelectedPlatform}
          onOpenSettings={() => setSettingsPanelOpen(true)}
        />

        <SettingsPanel
          open={settingsPanelOpen}
          onOpenChange={setSettingsPanelOpen}
          theme={theme}
          onThemeChange={setTheme}
        />

        {accountSettingsOpen && (
          <Dialog open={accountSettingsOpen} onOpenChange={setAccountSettingsOpen}>
            <DialogContent className="max-w-4xl h-[80vh] p-0">
              <Suspense fallback={<LoadingFallback />}>
                <AccountSettings
                  initialTab={accountSettingsTab}
                  onClose={() => setAccountSettingsOpen(false)}
                />
              </Suspense>
            </DialogContent>
          </Dialog>
        )}

        <Toaster />
      </div>
    </SidebarProvider>
  );
}
