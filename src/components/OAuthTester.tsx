import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { PlatformIcon } from './PlatformIcon';
import { useProject } from './ProjectContext';
import { OAuthDebugPanel } from './OAuthDebugPanel';
import { OAuthQuickHelp } from './OAuthQuickHelp';
import { connectionsAPI, getAuthToken, API_URL } from '../utils/api';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Trash2,
  Play,
  Loader2,
  Code,
  Terminal,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '../utils/logger';
import { toAppError } from '@/types';

type Platform = 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'youtube' | 'tiktok' | 'pinterest' | 'reddit';

interface PlatformTest {
  platform: Platform;
  name: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  error?: string;
  logs: TestLog[];
  connection?: ConnectionPayload;
}

interface TestLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  details?: unknown;
}

export function OAuthTester() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<Platform>('twitter');
  const [platformTests, setPlatformTests] = useState<Record<Platform, PlatformTest>>({
    twitter: { platform: 'twitter', name: 'Twitter/X', status: 'idle', logs: [] },
    instagram: { platform: 'instagram', name: 'Instagram', status: 'idle', logs: [] },
    linkedin: { platform: 'linkedin', name: 'LinkedIn', status: 'idle', logs: [] },
    facebook: { platform: 'facebook', name: 'Facebook', status: 'idle', logs: [] },
    youtube: { platform: 'youtube', name: 'YouTube', status: 'idle', logs: [] },
    tiktok: { platform: 'tiktok', name: 'TikTok', status: 'idle', logs: [] },
    pinterest: { platform: 'pinterest', name: 'Pinterest', status: 'idle', logs: [] },
    reddit: { platform: 'reddit', name: 'Reddit', status: 'idle', logs: [] },
  });
  const [connections, setConnections] = useState<ConnectionPayload[]>([]);
  const [envVarsStatus, setEnvVarsStatus] = useState<Record<string, boolean>>({});
  const [loadingConnections, setLoadingConnections] = useState(true);

  useEffect(() => {
    if (currentProject) {
      loadConnections();
      checkEnvVars();
    }
  }, [currentProject?.id]);

  const addLog = (platform: Platform, type: TestLog['type'], message: string, details?: unknown) => {
    setPlatformTests(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        logs: [...prev[platform].logs, {
          timestamp: new Date().toISOString(),
          type,
          message,
          details,
        }],
      },
    }));
  };

  const loadConnections = async () => {
    if (!currentProject) return;

    try {
      setLoadingConnections(true);
      const { connections: savedConnections } = await connectionsAPI.getAll(currentProject.id);
      setConnections(savedConnections || []);

      // Update platform tests with connection status
      setPlatformTests(prev => {
        const updated = { ...prev };
        savedConnections?.forEach((conn: ConnectionPayload) => {
          if (updated[conn.platform as Platform]) {
            updated[conn.platform as Platform].connection = conn;
            updated[conn.platform as Platform].status = conn.connected ? 'success' : 'idle';
          }
        });
        return updated;
      });
    } catch (error: unknown) {
      logger.error('Failed to load connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setLoadingConnections(false);
    }
  };

  const checkEnvVars = async () => {
    // This is a visual check - we can't actually verify env vars from the frontend
    // But we can try to initiate auth and see if it fails
    const platforms: Platform[] = ['twitter', 'instagram', 'linkedin', 'facebook', 'youtube', 'tiktok', 'pinterest', 'reddit'];
    
    for (const platform of platforms) {
      try {
        const authToken = await getAuthToken();
        const response = await fetch(
          `${API_URL}/oauth/authorize/${platform}?projectId=test`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          }
        );

        const data = await response.json();
        
        if (response.ok) {
          setEnvVarsStatus(prev => ({ ...prev, [platform]: true }));
        } else {
          setEnvVarsStatus(prev => ({ ...prev, [platform]: false }));
          if (data.error?.includes('not configured')) {
            addLog(platform, 'warning', 'Environment variables not configured', data.error);
          }
        }
      } catch (error) {
        setEnvVarsStatus(prev => ({ ...prev, [platform]: false }));
      }
    }
  };

  const testOAuthFlow = async (platform: Platform) => {
    if (!currentProject) {
      toast.error('No project selected');
      return;
    }

    setPlatformTests(prev => ({
      ...prev,
      [platform]: { ...prev[platform], status: 'testing', logs: [] },
    }));

    addLog(platform, 'info', `Starting OAuth flow test for ${platformTests[platform].name}...`);

    try {
      // Step 1: Check env vars
      addLog(platform, 'info', 'Checking environment variables...');
      
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated. Please sign in first.');
      }
      addLog(platform, 'success', 'User authenticated');

      // Step 2: Request authorization URL
      addLog(platform, 'info', 'Requesting authorization URL...');
      const authResponse = await fetch(
        `${API_URL}/oauth/authorize/${platform}?projectId=${currentProject.id}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.error || 'Failed to get authorization URL');
      }

      addLog(platform, 'success', 'Authorization URL generated', {
        url: authData.authUrl,
        state: authData.state,
      });

      // Step 3: Store state and redirect
      addLog(platform, 'info', 'Storing OAuth state in sessionStorage...');
      sessionStorage.setItem('oauth_state', authData.state);
      sessionStorage.setItem('oauth_platform', platform);
      sessionStorage.setItem('oauth_project_id', currentProject.id);
      addLog(platform, 'success', 'OAuth state stored');

      // Step 4: Redirect to OAuth provider
      addLog(platform, 'info', `Redirecting to ${platformTests[platform].name} authorization page...`);
      
      toast.info(`Redirecting to ${platformTests[platform].name}...`, {
        description: 'You will be asked to authorize PubHub',
      });

      setTimeout(() => {
        window.location.href = authData.authUrl;
      }, 1500);

    } catch (error: unknown) {
      const err = toAppError(error);
      logger.error(`OAuth test failed for ${platform}:`, error);
      addLog(platform, 'error', err.message || 'OAuth flow failed', error);
      setPlatformTests(prev => ({
        ...prev,
        [platform]: { ...prev[platform], status: 'error', error: err.message },
      }));
      toast.error(`OAuth test failed: ${err.message}`);
    }
  };

  const testDisconnect = async (platform: Platform) => {
    if (!currentProject) {
      toast.error('No project selected');
      return;
    }

    setPlatformTests(prev => ({
      ...prev,
      [platform]: { ...prev[platform], status: 'testing' },
    }));

    addLog(platform, 'info', 'Testing disconnect flow...');

    try {
      const authToken = await getAuthToken();
      const response = await fetch(
        `${API_URL}/oauth/disconnect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            platform,
            projectId: currentProject.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Disconnect failed');
      }

      addLog(platform, 'success', 'Disconnect successful');
      setPlatformTests(prev => ({
        ...prev,
        [platform]: { ...prev[platform], status: 'idle', connection: null },
      }));
      
      await loadConnections();
      toast.success(`${platformTests[platform].name} disconnected`);
    } catch (error: unknown) {
      const err = toAppError(error);
      logger.error(`Disconnect failed for ${platform}:`, error);
      addLog(platform, 'error', err.message || 'Disconnect failed');
      setPlatformTests(prev => ({
        ...prev,
        [platform]: { ...prev[platform], status: 'error', error: err.message },
      }));
      toast.error(`Disconnect failed: ${err.message}`);
    }
  };

  const clearLogs = (platform: Platform) => {
    setPlatformTests(prev => ({
      ...prev,
      [platform]: { ...prev[platform], logs: [] },
    }));
  };

  const copyLogs = (platform: Platform) => {
    const logs = platformTests[platform].logs
      .map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`)
      .join('\n');
    
    navigator.clipboard.writeText(logs);
    toast.success('Logs copied to clipboard');
  };

  const getStatusIcon = (status: PlatformTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'testing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLogIcon = (type: TestLog['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Terminal className="w-4 h-4 text-blue-500" />;
    }
  };

  const platforms: Platform[] = ['twitter', 'instagram', 'linkedin', 'facebook', 'youtube', 'tiktok', 'pinterest', 'reddit'];

  if (loadingConnections) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Panel */}
      <OAuthDebugPanel />

      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded shadow-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-blue-400">OAuth Testing & Debugging</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Test OAuth flows for each platform, view detailed logs, and debug connection issues.
              Each test will walk through the complete OAuth flow and show you exactly what's happening.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-muted-foreground">
                  {platforms.filter(p => platformTests[p].status === 'success').length} Connected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-muted-foreground">
                  {platforms.filter(p => envVarsStatus[p] === false).length} Missing Credentials
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <OAuthQuickHelp />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadConnections();
                checkEnvVars();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </div>
      </Card>

      {/* Platform Tests */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Platform)}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-6">
            {platforms.map(platform => (
              <TabsTrigger key={platform} value={platform} className="relative">
                <PlatformIcon platform={platform} className="w-4 h-4 mr-1" size={16} />
                <span className="hidden md:inline">{platformTests[platform].name}</span>
                {platformTests[platform].status !== 'idle' && (
                  <span className="absolute -top-1 -right-1">
                    {getStatusIcon(platformTests[platform].status)}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {platforms.map(platform => {
            const test = platformTests[platform];
            const envConfigured = envVarsStatus[platform] !== false;

            return (
              <TabsContent key={platform} value={platform} className="space-y-4">
                {/* Status Card */}
                <Card className="p-4 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={platform} className="w-8 h-8" size={32} />
                      <div>
                        <h4 className="flex items-center gap-2">
                          {test.name}
                          {test.connection?.connected && (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              Connected
                            </Badge>
                          )}
                        </h4>
                        {test.connection?.username && (
                          <p className="text-sm text-muted-foreground">@{test.connection.username}</p>
                        )}
                      </div>
                    </div>
                    {getStatusIcon(test.status)}
                  </div>

                  {/* Environment Variables Status */}
                  <div className="mb-4 p-3 bg-background rounded border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        <span className="text-sm">Environment Variables</span>
                      </div>
                      {envConfigured ? (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          Configured
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <XCircle className="w-3 h-3 text-red-500" />
                          Missing
                        </Badge>
                      )}
                    </div>
                    {!envConfigured && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Required: {platform.toUpperCase()}_CLIENT_ID and {platform.toUpperCase()}_CLIENT_SECRET
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!test.connection?.connected ? (
                      <Button
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                        onClick={() => testOAuthFlow(platform)}
                        disabled={test.status === 'testing' || !envConfigured}
                      >
                        {test.status === 'testing' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Test OAuth Flow
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => testOAuthFlow(platform)}
                          disabled={test.status === 'testing'}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reconnect
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => testDisconnect(platform)}
                          disabled={test.status === 'testing'}
                          className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Disconnect
                        </Button>
                      </>
                    )}
                  </div>
                </Card>

                {/* Logs */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      Test Logs
                      {test.logs.length > 0 && (
                        <Badge variant="outline">{test.logs.length}</Badge>
                      )}
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLogs(platform)}
                        disabled={test.logs.length === 0}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearLogs(platform)}
                        disabled={test.logs.length === 0}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[400px] w-full rounded border bg-black/20 p-3">
                    {test.logs.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No logs yet. Click "Test OAuth Flow" to start testing.
                      </div>
                    ) : (
                      <div className="space-y-2 font-mono text-xs">
                        {test.logs.map((log, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 rounded hover:bg-background/50">
                            {getLogIcon(log.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <span className={
                                  log.type === 'error' ? 'text-red-400' :
                                  log.type === 'success' ? 'text-green-400' :
                                  log.type === 'warning' ? 'text-yellow-400' :
                                  'text-blue-400'
                                }>
                                  {log.message}
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              {log.details && (
                                <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </Card>

                {/* OAuth Documentation */}
                <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                  <h4 className="mb-2 text-purple-400 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Platform Documentation
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Need help setting up OAuth credentials? Check the official documentation:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const docs: Record<Platform, string> = {
                        twitter: 'https://developer.twitter.com/en/docs/authentication/oauth-2-0',
                        instagram: 'https://developers.facebook.com/docs/instagram-basic-display-api',
                        linkedin: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication',
                        facebook: 'https://developers.facebook.com/docs/facebook-login',
                        youtube: 'https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps',
                        tiktok: 'https://developers.tiktok.com/doc/login-kit-web',
                        pinterest: 'https://developers.pinterest.com/docs/getting-started/authentication/',
                        reddit: 'https://github.com/reddit-archive/reddit/wiki/OAuth2',
                      };
                      window.open(docs[platform], '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View {test.name} OAuth Documentation
                  </Button>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
        <h4 className="mb-3 text-emerald-400">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={() => {
              platforms.forEach(platform => clearLogs(platform));
              toast.success('All logs cleared');
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Logs
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const allLogs = platforms
                .map(platform => {
                  const logs = platformTests[platform].logs;
                  if (logs.length === 0) return null;
                  return `\n=== ${platformTests[platform].name} ===\n${
                    logs.map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`).join('\n')
                  }`;
                })
                .filter(Boolean)
                .join('\n\n');
              
              navigator.clipboard.writeText(allLogs);
              toast.success('All logs copied to clipboard');
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy All Logs
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              loadConnections();
              checkEnvVars();
              toast.success('Status refreshed');
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </Card>
    </div>
  );
}
