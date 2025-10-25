import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  RefreshCw,
  Terminal,
  XCircle,
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAuthToken } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface DebugInfo {
  section: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export function OAuthDebugPanel() {
  const [debugging, setDebugging] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([]);

  const runDiagnostics = async () => {
    setDebugging(true);
    setDebugInfo([]);
    
    const info: DebugInfo[] = [];

    // Check 1: Authentication
    info.push({
      section: 'Authentication',
      status: 'info',
      message: 'Checking user authentication...',
    });

    const authToken = getAuthToken();
    if (authToken) {
      info.push({
        section: 'Authentication',
        status: 'success',
        message: 'User is authenticated',
        details: 'Access token found in localStorage',
      });
    } else {
      info.push({
        section: 'Authentication',
        status: 'error',
        message: 'User is not authenticated',
        details: 'No access token found. Please sign in.',
      });
      setDebugInfo([...info]);
      setDebugging(false);
      return;
    }

    // Check 2: Supabase Configuration
    info.push({
      section: 'Supabase',
      status: 'info',
      message: 'Checking Supabase configuration...',
    });

    if (projectId && publicAnonKey) {
      info.push({
        section: 'Supabase',
        status: 'success',
        message: 'Supabase is configured',
        details: `Project ID: ${projectId}`,
      });
    } else {
      info.push({
        section: 'Supabase',
        status: 'error',
        message: 'Supabase configuration missing',
        details: 'Project ID or Public Anon Key not found',
      });
    }

    setDebugInfo([...info]);

    // Check 3: Backend Health
    info.push({
      section: 'Backend',
      status: 'info',
      message: 'Checking backend health...',
    });
    setDebugInfo([...info]);

    try {
      const healthResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (healthResponse.ok) {
        info.push({
          section: 'Backend',
          status: 'success',
          message: 'Backend is healthy',
          details: 'Edge function is responding',
        });
      } else {
        info.push({
          section: 'Backend',
          status: 'error',
          message: 'Backend health check failed',
          details: `Status: ${healthResponse.status}`,
        });
      }
    } catch (error: any) {
      info.push({
        section: 'Backend',
        status: 'error',
        message: 'Cannot reach backend',
        details: error.message,
      });
    }

    setDebugInfo([...info]);

    // Check 4: OAuth Routes
    info.push({
      section: 'OAuth Routes',
      status: 'info',
      message: 'Checking OAuth route availability...',
    });
    setDebugInfo([...info]);

    const platforms = ['twitter', 'instagram', 'linkedin', 'facebook', 'youtube', 'tiktok', 'pinterest', 'reddit'];
    let configuredCount = 0;
    let notConfiguredPlatforms: string[] = [];

    for (const platform of platforms) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/oauth/authorize/${platform}?projectId=test`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          configuredCount++;
        } else if (data.error?.includes('not configured')) {
          notConfiguredPlatforms.push(platform);
        }
      } catch (error) {
        // Ignore network errors for this check
      }
    }

    if (configuredCount === platforms.length) {
      info.push({
        section: 'OAuth Routes',
        status: 'success',
        message: 'All platforms configured',
        details: `${configuredCount}/${platforms.length} platforms have OAuth credentials`,
      });
    } else if (configuredCount > 0) {
      info.push({
        section: 'OAuth Routes',
        status: 'warning',
        message: 'Some platforms not configured',
        details: `${configuredCount}/${platforms.length} platforms configured. Missing: ${notConfiguredPlatforms.join(', ')}`,
      });
    } else {
      info.push({
        section: 'OAuth Routes',
        status: 'error',
        message: 'No platforms configured',
        details: 'Add OAuth credentials to Supabase environment variables',
      });
    }

    setDebugInfo([...info]);

    // Check 5: Frontend URL
    info.push({
      section: 'Configuration',
      status: 'info',
      message: 'Checking frontend URL configuration...',
    });
    setDebugInfo([...info]);

    const currentUrl = window.location.origin;
    info.push({
      section: 'Configuration',
      status: 'info',
      message: 'Current URL detected',
      details: `Frontend URL: ${currentUrl}`,
    });

    if (currentUrl.startsWith('https://')) {
      info.push({
        section: 'Configuration',
        status: 'success',
        message: 'Using HTTPS (recommended for production)',
      });
    } else if (currentUrl.startsWith('http://localhost')) {
      info.push({
        section: 'Configuration',
        status: 'warning',
        message: 'Using localhost (development mode)',
        details: 'Make sure FRONTEND_URL is set correctly in production',
      });
    } else {
      info.push({
        section: 'Configuration',
        status: 'warning',
        message: 'Not using HTTPS',
        details: 'OAuth may not work properly without HTTPS in production',
      });
    }

    setDebugInfo([...info]);

    // Check 6: OAuth Callback Route
    info.push({
      section: 'Routes',
      status: 'info',
      message: 'Checking OAuth callback route...',
    });
    setDebugInfo([...info]);

    const callbackUrl = `${currentUrl}/oauth/callback`;
    info.push({
      section: 'Routes',
      status: 'success',
      message: 'OAuth callback URL',
      details: callbackUrl,
    });

    // Summary
    const errors = info.filter(i => i.status === 'error').length;
    const warnings = info.filter(i => i.status === 'warning').length;
    const successes = info.filter(i => i.status === 'success').length;

    info.push({
      section: 'Summary',
      status: errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'success',
      message: `Diagnostics complete`,
      details: `✅ ${successes} passed, ⚠️ ${warnings} warnings, ❌ ${errors} errors`,
    });

    setDebugInfo([...info]);
    setDebugging(false);

    if (errors === 0 && warnings === 0) {
      toast.success('All diagnostics passed!');
    } else if (errors > 0) {
      toast.error(`Found ${errors} critical issues`);
    } else {
      toast.warning(`Found ${warnings} warnings`);
    }
  };

  const copyDebugInfo = () => {
    const text = debugInfo
      .map(info => `[${info.status.toUpperCase()}] ${info.section}: ${info.message}${info.details ? `\n  Details: ${info.details}` : ''}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text);
    toast.success('Debug info copied to clipboard');
  };

  const getStatusIcon = (status: DebugInfo['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Terminal className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: DebugInfo['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            OAuth Diagnostics
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Run comprehensive checks on your OAuth configuration
          </p>
        </div>
        <div className="flex gap-2">
          {debugInfo.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyDebugInfo}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          )}
          <Button
            onClick={runDiagnostics}
            disabled={debugging}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            {debugging ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Diagnostics
              </>
            )}
          </Button>
        </div>
      </div>

      {debugInfo.length === 0 ? (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertDescription>
            Click "Run Diagnostics" to check your OAuth configuration, backend health,
            and environment setup. This will help identify any issues before testing individual platforms.
          </AlertDescription>
        </Alert>
      ) : (
        <ScrollArea className="h-[500px] w-full rounded border bg-black/20 p-4">
          <div className="space-y-3 font-mono text-sm">
            {debugInfo.map((info, index) => (
              <div
                key={index}
                className="p-3 rounded border border-border/50 hover:border-border bg-background/50"
              >
                <div className="flex items-start gap-2">
                  {getStatusIcon(info.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {info.section}
                      </span>
                    </div>
                    <div className={`mb-1 ${getStatusColor(info.status)}`}>
                      {info.message}
                    </div>
                    {info.details && (
                      <div className="text-xs text-muted-foreground mt-1 pl-4 border-l-2 border-border/50">
                        {info.details}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Quick fixes */}
      {debugInfo.length > 0 && debugInfo.some(i => i.status === 'error' || i.status === 'warning') && (
        <div className="mt-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Issues detected.</strong> Common fixes:
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                {debugInfo.some(i => i.message.includes('not authenticated')) && (
                  <li>Sign in to your account</li>
                )}
                {debugInfo.some(i => i.message.includes('not configured')) && (
                  <li>Add OAuth credentials to Supabase environment variables</li>
                )}
                {debugInfo.some(i => i.message.includes('Backend')) && (
                  <li>Check if Supabase Edge Functions are deployed</li>
                )}
                {debugInfo.some(i => i.message.includes('HTTPS')) && (
                  <li>Ensure FRONTEND_URL uses HTTPS in production</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  );
}
