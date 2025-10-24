import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PlatformIcon } from "./PlatformIcon";
import { connectionsAPI } from "../utils/api";
import { useProject } from "./ProjectContext";
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
import { toast } from "sonner@2.0.3";

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
  const { currentProject } = useProject();

  // Load connections from backend when project changes
  useEffect(() => {
    if (currentProject) {
      loadConnections();
    }
  }, [currentProject?.id]);

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
      console.error('Failed to load connections:', error);
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
      console.error('Failed to save connections:', error);
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
    if (platformToDisconnect) {
      const updatedConnections = connections.map(conn => 
        conn.platform === platformToDisconnect 
          ? { ...conn, connected: false, username: undefined, followers: undefined, autoPost: false }
          : conn
      );
      setConnections(updatedConnections);
      await saveConnections(updatedConnections);
      
      const platformName = connections.find(c => c.platform === platformToDisconnect)?.name;
      toast.success(`${platformName} disconnected successfully`);
    }
    setPlatformToDisconnect(null);
  };

  const toggleConnection = async (platform: Platform) => {
    const conn = connections.find(c => c.platform === platform);
    if (conn?.connected) {
      // If disconnecting, show confirmation
      handleDisconnectClick(platform);
    } else {
      // If connecting, simulate OAuth flow
      toast.info(`Connecting to ${conn?.name}...`, {
        description: 'In a production app, this would redirect to OAuth authorization.'
      });
      
      // Simulate connection (in production, this would be real OAuth)
      const updatedConnections = connections.map(c => 
        c.platform === platform 
          ? { ...c, connected: true, username: `@${conn?.name.toLowerCase()}user`, followers: "0" }
          : c
      );
      setConnections(updatedConnections);
      await saveConnections(updatedConnections);
      
      toast.success(`${conn?.name} connected successfully`);
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.filter(c => c.connected).map((connection) => (
            <Card key={connection.platform} className="p-6">
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
                    <p className="text-sm text-muted-foreground">{connection.username}</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
