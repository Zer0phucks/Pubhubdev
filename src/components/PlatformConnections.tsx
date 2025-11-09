import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PlatformIcon } from "./PlatformIcon";
import { connectionsAPI, oauthAPI, setAuthToken } from "../utils/api";
import { useProject } from "./ProjectContext";
import { supabase } from "../utils/supabase/client";
import {
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  Settings,
  Trash2,
  Plus,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { WordPressConnectionDialog, WordPressCredentials } from "./WordPressConnectionDialog";
import { toast } from "sonner";
import { logger } from "../utils/logger";

type Platform = "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface PlatformConnection {
  platform: Platform;
  name: string;
  connected: boolean;
  username?: string;
  followers?: string;
  autoPost?: boolean;
  description: string;
}

export function PlatformConnections() {
  const defaultConnections: PlatformConnection[] = [
    {
      platform: "twitter",
      name: "Twitter",
      connected: false,
      description: "Connect your Twitter account to post tweets and threads"
    },
    {
      platform: "instagram",
      name: "Instagram",
      connected: false,
      description: "Share photos, reels, and stories on Instagram"
    },
    {
      platform: "linkedin",
      name: "LinkedIn",
      connected: false,
      description: "Post professional content and articles on LinkedIn"
    },
    {
      platform: "facebook",
      name: "Facebook",
      connected: false,
      description: "Share updates on your Facebook page"
    },
    {
      platform: "youtube",
      name: "YouTube",
      connected: false,
      description: "Upload videos and manage your YouTube channel"
    },
    {
      platform: "tiktok",
      name: "TikTok",
      connected: false,
      description: "Create and share short-form videos on TikTok"
    },
    {
      platform: "pinterest",
      name: "Pinterest",
      connected: false,
      description: "Pin your content and ideas on Pinterest boards"
    },
    {
      platform: "reddit",
      name: "Reddit",
      connected: false,
      description: "Engage with communities and share content on Reddit"
    },
    {
      platform: "blog",
      name: "Blog",
      connected: false,
      description: "Publish articles and posts to your WordPress, Medium, or custom blog"
    }
  ];

  const [connections, setConnections] = useState<PlatformConnection[]>(defaultConnections);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);
  const [platformToDisconnect, setPlatformToDisconnect] = useState<Platform | null>(null);
  const [wordpressDialogOpen, setWordpressDialogOpen] = useState(false);
  const { currentProject } = useProject();

  // Load connections from backend when project changes
  useEffect(() => {
    if (currentProject) {
      loadConnections();
    }
  }, [currentProject?.id]);

  // Refresh when returning from OAuth callback
  useEffect(() => {
    if (!currentProject) return;

    const checkOAuthCompletion = async () => {
      const oauthJustCompleted = sessionStorage.getItem('oauth_just_completed');
      if (oauthJustCompleted === 'true') {
        logger.info('OAuth just completed, refreshing connections...');
        // Add a small delay to ensure backend has saved the data
        setTimeout(() => {
          loadConnections();
          sessionStorage.removeItem('oauth_just_completed');
          sessionStorage.removeItem('oauth_completed_platform');
        }, 500);
      }
    };

    checkOAuthCompletion();

    // Poll for OAuth completion (check every second for 10 seconds)
    const intervalId = setInterval(() => {
      checkOAuthCompletion();
    }, 1000);

    // Also check on window focus in case user comes back from OAuth
    const handleFocus = () => {
      checkOAuthCompletion();
    };

    window.addEventListener('focus', handleFocus);
    
    // Clean up after 10 seconds to stop polling
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [currentProject]);

  const loadConnections = async () => {
    if (!currentProject) return;
    
    try {
      setLoading(true);
      const { connections: savedConnections } = await connectionsAPI.getAll(currentProject.id);
      
      // Merge saved connections with default structure
      if (savedConnections && savedConnections.length > 0) {
        const merged = defaultConnections.map(defaultConn => {
          const saved = savedConnections.find((s: any) => s.platform === defaultConn.platform);
          return saved ? { ...defaultConn, ...saved } : defaultConn;
        });
        setConnections(merged);
      }
    } catch (error) {
      logger.error('Failed to load connections', error);
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const saveConnections = async (updatedConnections: PlatformConnection[]) => {
    if (!currentProject) return;
    
    try {
      setSaving(true);
      await connectionsAPI.update(updatedConnections, currentProject.id);
    } catch (error: any) {
      logger.error('Failed to save connections', error);
      // Show specific error message if provided
      toast.error(error.message || 'Failed to save connections');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectClick = (platform: Platform) => {
    setPlatformToDisconnect(platform);
    setDisconnectConfirmOpen(true);
  };

  const confirmDisconnect = async () => {
    if (platformToDisconnect && currentProject) {
      try {
        // Ensure we have a fresh auth token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          throw new Error('You must be signed in to disconnect platforms');
        }

        // Update auth token for API calls
        setAuthToken(session.access_token);

        // Call backend to disconnect OAuth using centralized API
        const data = await oauthAPI.disconnect(platformToDisconnect, currentProject.id);

        // Update local state with response
        if (data.connections) {
          const merged = defaultConnections.map(defaultConn => {
            const saved = data.connections.find((s: any) => s.platform === defaultConn.platform);
            return saved ? { ...defaultConn, ...saved } : defaultConn;
          });
          setConnections(merged);
        }

        const platformName = connections.find(c => c.platform === platformToDisconnect)?.name;
        toast.success(`${platformName} disconnected successfully`);
        
        // Set flag to trigger header refresh (similar to connection completion)
        sessionStorage.setItem('platform_disconnected', 'true');
      } catch (error: any) {
        logger.error('Disconnect error', error, { platform });
        toast.error(error.message || 'Failed to disconnect platform');
      }
    }
    setPlatformToDisconnect(null);
  };

  const toggleConnection = async (platform: Platform) => {
    const conn = connections.find(c => c.platform === platform);
    if (conn?.connected) {
      // If disconnecting, show confirmation
      handleDisconnectClick(platform);
    } else {
      // For blog platform, show WordPress dialog instead of OAuth
      if (platform === "blog") {
        setWordpressDialogOpen(true);
      } else {
        // Start OAuth flow for other platforms
        await startOAuthFlow(platform);
      }
    }
  };

  const startOAuthFlow = async (platform: Platform) => {
    if (!currentProject) {
      toast.error('No project selected');
      return;
    }

    try {
      toast.info(`Connecting to ${platform}...`, {
        description: 'You will be redirected to authorize PubHub'
      });

      // Get current user session for authenticated request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('You must be signed in to connect platforms');
      }

      // Update auth token for API calls
      setAuthToken(session.access_token);

      // Get authorization URL from backend using centralized API
      const data = await oauthAPI.authorize(platform, currentProject.id);

      // Store state for callback verification
      sessionStorage.setItem('oauth_state', data.state);
      sessionStorage.setItem('oauth_platform', platform);
      sessionStorage.setItem('oauth_project_id', currentProject.id);

      // Redirect to OAuth provider
      window.location.href = data.authUrl;
    } catch (error: any) {
      logger.error('OAuth flow error', error, { platform });
      toast.error(error.message || 'Failed to connect platform');
    }
  };

  const toggleAutoPost = async (platform: Platform) => {
    const updatedConnections = connections.map(conn =>
      conn.platform === platform
        ? { ...conn, autoPost: !conn.autoPost }
        : conn
    );
    setConnections(updatedConnections);
    await saveConnections(updatedConnections);
  };

  const handleWordPressConnect = async (credentials: WordPressCredentials) => {
    if (!currentProject) {
      throw new Error('No project selected');
    }

    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('You must be signed in to connect WordPress');
      }

      // Update auth token for API calls
      setAuthToken(session.access_token);

      // Call backend to connect WordPress
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-19ccd85e/wordpress/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          projectId: currentProject.id,
          ...credentials
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect WordPress');
      }

      const data = await response.json();

      toast.success('WordPress connected successfully!');

      // Set flag to trigger header refresh (similar to OAuth completion)
      sessionStorage.setItem('wordpress_just_connected', 'true');
      
      // Refresh connections to show the new connection
      await loadConnections();
    } catch (error: any) {
      logger.error('WordPress connection error', error);
      throw error;
    }
  };

  const connectedCount = connections.filter(c => c.connected).length;
  const totalPlatforms = connections.length;

  const platformColors: Record<Platform, string> = {
    twitter: "from-blue-500 to-cyan-600",
    instagram: "from-pink-500 to-purple-600",
    linkedin: "from-blue-600 to-blue-700",
    facebook: "from-blue-500 to-blue-700",
    youtube: "from-red-500 to-red-700",
    tiktok: "from-cyan-400 to-pink-500",
    pinterest: "from-red-500 to-red-600",
    reddit: "from-orange-500 to-red-600",
    blog: "from-purple-500 to-indigo-600"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* OAuth Info Banner */}
      {connectedCount === 0 && (
        <Card className="p-4 bg-blue-500/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <LinkIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm mb-1 text-blue-400">Connect Your Social Accounts</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Click "Connect" on any platform below to authorize PubHub with your social media accounts. 
                You'll be redirected to the platform's authorization page and back automatically.
              </p>
              <p className="text-xs text-muted-foreground">
                Note: Make sure OAuth credentials are configured in your Supabase environment variables. 
                See OAUTH_SETUP.md for details.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3>Connected Platforms</h3>
              {saving && (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {connectedCount} of {totalPlatforms} platforms connected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-20 relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-emerald-500/20"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(connectedCount / totalPlatforms) * 226} 226`}
                  className="text-emerald-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-emerald-400">
                  {Math.round((connectedCount / totalPlatforms) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Connected Platforms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3>Connected ({connectedCount})</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="platform-connections">
          {connections.filter(c => c.connected).map((connection) => (
            <Card key={connection.platform} className="p-6" data-testid={`platform-${connection.platform}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <PlatformIcon platform={connection.platform} className="w-8 h-8" size={32} />
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2">
                      {connection.name}
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </h4>
                    <p className="text-sm text-muted-foreground" data-testid="platform-username">{connection.username}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Followers</span>
                  <Badge variant="outline">{connection.followers}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`auto-${connection.platform}`} className="text-sm text-muted-foreground cursor-pointer">
                    Auto-post enabled
                  </Label>
                  <Switch
                    id={`auto-${connection.platform}`}
                    checked={connection.autoPost}
                    onCheckedChange={() => toggleAutoPost(connection.platform)}
                    data-testid="auto-post-toggle"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedPlatform(connection.platform)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={connection.platform} className="w-5 h-5" size={20} />
                            {connection.name} Settings
                          </div>
                        </DialogTitle>
                        <DialogDescription>
                          Configure your {connection.name} connection settings
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" value={connection.username} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="followers">Followers</Label>
                          <Input id="followers" value={connection.followers} disabled />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auto-post">Auto-post enabled</Label>
                          <Switch 
                            id="auto-post"
                            checked={connection.autoPost} 
                            onCheckedChange={() => toggleAutoPost(connection.platform)}
                          />
                        </div>
                        <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Platform Dashboard
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                    onClick={() => toggleConnection(connection.platform)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Platforms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3>Available Platforms</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {connections.filter(c => !c.connected).map((connection) => (
            <Card key={connection.platform} className="p-6 hover:border-emerald-500/30 transition-all cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex-shrink-0">
                  <PlatformIcon platform={connection.platform} className="w-10 h-10" size={40} />
                </div>
                
                <div>
                  <h4 className="mb-1">{connection.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {connection.description}
                  </p>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  onClick={() => toggleConnection(connection.platform)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pro Tip */}
      <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded shadow-lg">
            <LinkIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="mb-1 text-blue-400">Pro Tip</h4>
            <p className="text-muted-foreground">
              Connect all your platforms to unlock cross-posting features and get unified analytics. 
              You can always disable auto-posting for specific platforms in their settings.
            </p>
          </div>
        </div>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <ConfirmDialog
        open={disconnectConfirmOpen}
        onOpenChange={setDisconnectConfirmOpen}
        title={`Disconnect ${connections.find(c => c.platform === platformToDisconnect)?.name}?`}
        description="This will remove the platform connection and disable all automated posting. You can reconnect at any time."
        confirmText="Disconnect"
        onConfirm={confirmDisconnect}
        variant="destructive"
      />

      {/* WordPress Connection Dialog */}
      <WordPressConnectionDialog
        open={wordpressDialogOpen}
        onOpenChange={setWordpressDialogOpen}
        onConnect={handleWordPressConnect}
      />
    </div>
  );
}
