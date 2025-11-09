import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { supabase } from '../utils/supabase/client';
import { oauthAPI, setAuthToken, getAuthToken } from '../utils/api';
import { logger } from '../utils/logger';

export function OAuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get URL parameters
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      // Get platform from URL query param or path (/api/oauth/callback/:platform)
      let platform = params.get('platform');
      if (!platform) {
        const pathMatch = window.location.pathname.match(/\/api\/oauth\/callback\/([^/]+)/);
        platform = pathMatch ? pathMatch[1] : null;
      }

      // Get stored OAuth data
      const storedState = sessionStorage.getItem('oauth_state');
      const storedPlatform = sessionStorage.getItem('oauth_platform') || platform; // Fallback to URL param/path
      const storedProjectId = sessionStorage.getItem('oauth_project_id');

      logger.info('OAuth Callback Debug:', {
        code: code ? 'present' : 'missing',
        state: state ? 'present' : 'missing',
        platform: platform || storedPlatform,
        storedState,
        url: window.location.href
      });

      // Handle OAuth errors
      if (error) {
        throw new Error(errorDescription || error);
      }

      // Validate parameters - be more lenient with platform
      if (!code || !state) {
        throw new Error('Missing required OAuth parameters (code or state)');
      }

      if (!storedPlatform) {
        throw new Error('Missing platform information. Please try connecting again.');
      }

      // Validate state matches (CSRF protection)
      if (state !== storedState) {
        throw new Error('Invalid OAuth state - possible CSRF attack');
      }

      setPlatform(storedPlatform);
      setMessage(`Connecting your ${storedPlatform} account...`);

      // Get fresh auth token from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('Not authenticated. Please sign in first.');
      }

      // Update auth token for API calls - ensure it's set before making the call
      const token = session.access_token;
      setAuthToken(token);
      
      // Verify token was set correctly before making API call
      const verifyToken = getAuthToken();
      if (!verifyToken || verifyToken !== token) {
        logger.warn('Token not properly set, retrying...');
        // Force set it directly
        localStorage.setItem('pubhub_auth_token', token);
      }

      // Exchange code for token on backend using centralized API
      const data = await oauthAPI.callback(code, state, storedPlatform);

      // Success!
      setStatus('success');
      setMessage(`Successfully connected ${data.username || 'your account'}!`);

      // Clean up session storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_platform');
      sessionStorage.removeItem('oauth_project_id');
      
      // Set flag to trigger refresh in components
      sessionStorage.setItem('oauth_just_completed', 'true');
      sessionStorage.setItem('oauth_completed_platform', storedPlatform);

      // Redirect to home after 2 seconds - components will check for the flag and refresh
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      logger.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to connect platform');

      // Clean up session storage even on error
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_platform');
      sessionStorage.removeItem('oauth_project_id');
    }
  };

  const handleRetry = () => {
    sessionStorage.removeItem('oauth_just_completed');
    sessionStorage.removeItem('oauth_completed_platform');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-emerald-500 animate-spin" />
            <h2 className="text-xl">Connecting Platform</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl">Success!</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl">Connection Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <Button onClick={handleRetry} variant="outline" className="w-full">
              Return to Dashboard
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
