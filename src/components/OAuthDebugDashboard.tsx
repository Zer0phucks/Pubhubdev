import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useProject } from './ProjectContext';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Terminal,
  Bug,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type Platform = 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'youtube' | 'tiktok' | 'pinterest' | 'reddit' | 'blog';

interface PlatformDebugInfo {
  platform: Platform;
  name: string;
  status: 'not_configured' | 'partial' | 'configured' | 'connected' | 'error';
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRedirectUri: boolean;
  connection?: {
    connected: boolean;
    username?: string;
    tokenExists?: boolean;
    tokenExpiry?: string;
    lastRefresh?: string;
  };
  authUrl?: string;
  tokenUrl?: string;
  apiEndpoint?: string;
  requiredScopes?: string;
  errors: string[];
  debugInfo?: any;
}

export function OAuthDebugDashboard() {
  const [platforms, setPlatforms] = useState<PlatformDebugInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<Platform | null>(null);
  const { currentProject } = useProject();

  const platformConfigs: PlatformDebugInfo[] = [
    {
      platform: 'twitter',
      name: 'Twitter/X',
      status: 'not_configured',
      hasClientId: false,
      hasClientSecret: false,
      hasRedirectUri: true,
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      apiEndpoint: 'POST https://api.twitter.com/2/tweets',
      requiredScopes: 'tweet.read tweet.write users.read offline.access',
      errors: [],
    },
    {
      platform: 'instagram',
      name: 'Instagram',
      status: 'not_configured',
      hasClientId: false,
      hasClientSecret: false,
      hasRedirectUri: true,
      authUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      apiEndpoint: 'POST https://graph.facebook.com/v18.0/{ig-user-id}/media',
      requiredScopes: 'user_profile,user_media',
      errors: [],
    },
    {
      platform: 'linkedin',
      name: 'LinkedIn',
      status: 'not_configured',
      hasClientId: false,
      hasClientSecret: false,
      hasRedirectUri: true,
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      apiEndpoint: 'POST https://api.linkedin.com/v2/ugcPosts',
      requiredScopes: 'w_member_social r_liteprofile',
      errors: [],
    },
    {
      platform: 'facebook',
      name: 'Facebook',
      status: 'not_configured',
      hasClientId: false,
      hasClientSecret: false,
      hasRedirectUri: true,
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      apiEndpoint: 'POST https://graph.facebook.com/v18.0/{page-id}/feed',
      requiredScopes: 'pages_manage_posts,pages_read_engagement',
      errors: [],
    },
    {
      platform: 'youtube',
      name: 'YouTube',
      status: 'not_configured',
      hasClientId: false,
      hasClientSecret: false,
      hasRedirectUri: true,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      apiEndpoint: 'POST https://www.googleapis.com/youtube/v3/videos',
      requiredScopes: 'https://www.googleapis.com/auth/youtube.upload',
      errors: [],
    },
    {
      platform: 'tiktok',
      name: 'TikTok',
      status: 'not_configured',
      hasClientId: false,
      hasClientSecret: false,
      hasRedirectUri: true,
      authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      apiEndpoint: 'POST https://open.tiktokapis.com/v2/post/publish/video/init/',
      requiredScopes: 'user.info.basic,video.upload',
      errors: [],
    },
    {
      platform: 'pinterest',
      name: 'Pinterest',
      status: 'not_configured',
      hasClientId: false,
      hasClientSecret: false,
      hasRedirectUri: true,
      authUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      apiEndpoint: 'POST https://api.pinterest.com/v5/pins',
      requiredScopes: 'boards:read,pins:read,pins:write',
      errors: [],
    },
    {
      platform: 'reddit',
      name: 'Reddit',
      status: 'not_configured',
      hasClientId: false,
      hasClientSecret: false,
      hasRedirectUri: true,
      authUrl: 'https://www.reddit.com/api/v1/authorize',
      tokenUrl: 'https://www.reddit.com/api/v1/access_token',
      apiEndpoint: 'POST https://oauth.reddit.com/api/submit',
      requiredScopes: 'submit identity',
      errors: [],
    },
  ];

  useEffect(() => {
    if (currentProject) {
      checkPlatformConfigurations();
    }
  }, [currentProject?.id]);

  const checkPlatformConfigurations = async () => {
    if (!currentProject) return;

    setLoading(true);
    const updatedPlatforms: PlatformDebugInfo[] = [];

    for (const config of platformConfigs) {
      try {
        // Test authorization endpoint
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/oauth/authorize/${config.platform}?projectId=${currentProject.id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.authUrl) {
          // OAuth is configured
          config.status = 'configured';
          config.hasClientId = true;
          config.hasClientSecret = true;
        } else if (data.error) {
          // Check error message to determine configuration status
          if (data.error.includes('not configured')) {
            config.status = 'not_configured';
            config.errors.push(data.error);
          } else {
            config.status = 'error';
            config.errors.push(data.error);
          }
        }

        // Check for existing connection
        const connections = await checkExistingConnections(config.platform);
        if (connections) {
          config.connection = connections;
          if (connections.connected) {
            config.status = 'connected';
          }
        }
      } catch (error: any) {
        config.status = 'error';
        config.errors.push(`Failed to check configuration: ${error.message}`);
      }

      updatedPlatforms.push(config);
    }

    setPlatforms(updatedPlatforms);
    setLoading(false);
  };

  const checkExistingConnections = async (platform: Platform) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/connections?projectId=${currentProject?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const connection = data.connections?.find((c: any) => c.platform === platform);
        return connection || null;
      }
    } catch (error) {
      console.error('Failed to check connections:', error);
    }
    return null;
  };

  const testOAuthFlow = async (platform: Platform) => {
    if (!currentProject) {
      toast.error('No project selected');
      return;
    }

    setTesting(platform);
    try {
      // Start OAuth flow test
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/oauth/authorize/${platform}?projectId=${currentProject.id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.authUrl) {
        toast.success(`OAuth URL generated successfully for ${platform}`, {
          description: 'Check the console for the authorization URL'
        });
        console.log(`${platform} OAuth URL:`, data.authUrl);
        console.log(`State parameter:`, data.state);

        // Copy URL to clipboard
        await navigator.clipboard.writeText(data.authUrl);
        toast.info('Authorization URL copied to clipboard');
      } else {
        toast.error(`OAuth test failed for ${platform}`, {
          description: data.error || 'Unknown error'
        });
      }
    } catch (error: any) {
      toast.error(`Test failed for ${platform}`, {
        description: error.message
      });
    } finally {
      setTesting(null);
    }
  };

  const copyDebugInfo = async (platform: PlatformDebugInfo) => {
    const debugText = `
OAuth Debug Info for ${platform.name}
=====================================
Platform: ${platform.platform}
Status: ${platform.status}
Has Client ID: ${platform.hasClientId}
Has Client Secret: ${platform.hasClientSecret}
Has Redirect URI: ${platform.hasRedirectUri}

Auth URL: ${platform.authUrl}
Token URL: ${platform.tokenUrl}
API Endpoint: ${platform.apiEndpoint}
Required Scopes: ${platform.requiredScopes}

Connection Status: ${platform.connection?.connected ? 'Connected' : 'Not Connected'}
${platform.connection?.username ? `Username: ${platform.connection.username}` : ''}

Errors:
${platform.errors.join('\n')}

Environment Variables Needed:
${platform.platform === 'twitter' ? 'TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET' : ''}
${platform.platform === 'instagram' ? 'INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET' : ''}
${platform.platform === 'linkedin' ? 'LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET' : ''}
${platform.platform === 'facebook' ? 'FACEBOOK_APP_ID, FACEBOOK_APP_SECRET' : ''}
${platform.platform === 'youtube' ? 'YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET' : ''}
${platform.platform === 'tiktok' ? 'TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET' : ''}
${platform.platform === 'pinterest' ? 'PINTEREST_APP_ID, PINTEREST_APP_SECRET' : ''}
${platform.platform === 'reddit' ? 'REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET' : ''}
`;
    await navigator.clipboard.writeText(debugText);
    toast.success('Debug info copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'configured':
        return 'text-blue-500';
      case 'partial':
        return 'text-yellow-500';
      case 'not_configured':
        return 'text-gray-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'configured':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5" />;
      case 'not_configured':
      case 'error':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      connected: 'default',
      configured: 'secondary',
      partial: 'outline',
      not_configured: 'outline',
      error: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status.replace('_', ' ')}
      </Badge>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">OAuth Debug Dashboard</h2>
          <p className="text-muted-foreground">Test and debug OAuth platform integrations</p>
        </div>
        <Button onClick={checkPlatformConfigurations} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-500">
            {platforms.filter(p => p.status === 'connected').length}
          </div>
          <p className="text-sm text-muted-foreground">Connected</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-500">
            {platforms.filter(p => p.status === 'configured').length}
          </div>
          <p className="text-sm text-muted-foreground">Configured</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-500">
            {platforms.filter(p => p.status === 'partial').length}
          </div>
          <p className="text-sm text-muted-foreground">Partial</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-500">
            {platforms.filter(p => p.status === 'not_configured').length}
          </div>
          <p className="text-sm text-muted-foreground">Not Configured</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-500">
            {platforms.filter(p => p.status === 'error').length}
          </div>
          <p className="text-sm text-muted-foreground">Errors</p>
        </Card>
      </div>

      {/* Platform Details */}
      <div className="space-y-4">
        {platforms.map(platform => (
          <Card key={platform.platform} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={getStatusColor(platform.status)}>
                    {getStatusIcon(platform.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{platform.name}</h3>
                    <code className="text-xs text-muted-foreground">{platform.platform}</code>
                  </div>
                </div>
                {getStatusBadge(platform.status)}
              </div>

              {/* Configuration Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {platform.hasClientId ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm">Client ID</span>
                </div>
                <div className="flex items-center gap-2">
                  {platform.hasClientSecret ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm">Client Secret</span>
                </div>
                <div className="flex items-center gap-2">
                  {platform.hasRedirectUri ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm">Redirect URI</span>
                </div>
              </div>

              {/* Connection Info */}
              {platform.connection && (
                <Alert>
                  <AlertDescription>
                    {platform.connection.connected ? (
                      <div className="space-y-1">
                        <p>✅ Connected as: <strong>{platform.connection.username}</strong></p>
                        {platform.connection.tokenExists && (
                          <p className="text-xs text-muted-foreground">Token stored</p>
                        )}
                      </div>
                    ) : (
                      <p>Not connected</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Technical Details */}
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Auth URL:</span>
                    <code className="ml-2 text-blue-500">{platform.authUrl}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Token URL:</span>
                    <code className="ml-2 text-blue-500">{platform.tokenUrl}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">API Endpoint:</span>
                    <code className="ml-2 text-blue-500">{platform.apiEndpoint}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scopes:</span>
                    <code className="ml-2 text-green-500">{platform.requiredScopes}</code>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {platform.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="space-y-1">
                      {platform.errors.map((error, i) => (
                        <p key={i} className="text-sm">{error}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testOAuthFlow(platform.platform)}
                  disabled={testing === platform.platform}
                >
                  {testing === platform.platform ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Terminal className="w-4 h-4 mr-2" />
                  )}
                  Test OAuth
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyDebugInfo(platform)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Debug Info
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`https://developers.${platform.platform}.com`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Developer Docs
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Debug Commands */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Debug Commands
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-mono mb-1">Check Supabase Edge Function logs:</p>
            <code className="text-xs text-blue-500">
              supabase functions logs make-server-19ccd85e --tail
            </code>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-mono mb-1">Test authorization endpoint:</p>
            <code className="text-xs text-blue-500">
              curl -H "Authorization: Bearer {publicAnonKey}" \<br />
              https://{projectId}.supabase.co/functions/v1/make-server-19ccd85e/oauth/authorize/[platform]?projectId=[id]
            </code>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-mono mb-1">Environment variables format:</p>
            <code className="text-xs text-green-500">
              PLATFORM_CLIENT_ID=your_client_id<br />
              PLATFORM_CLIENT_SECRET=your_client_secret<br />
              FRONTEND_URL=https://your-app.com
            </code>
          </div>
        </div>
      </Card>
    </div>
  );
}