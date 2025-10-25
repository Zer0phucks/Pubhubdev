import { useEffect, useState } from 'react';
import { projectId } from '../utils/supabase/info';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { supabase } from '../utils/supabase/client';

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
      
      // Get stored OAuth data
      const storedState = sessionStorage.getItem('oauth_state');
      const storedPlatform = sessionStorage.getItem('oauth_platform');
      const storedProjectId = sessionStorage.getItem('oauth_project_id');

      // Handle OAuth errors
      if (error) {
        throw new Error(errorDescription || error);
      }

      // Validate parameters
      if (!code || !state || !storedPlatform) {
        throw new Error('Missing required OAuth parameters');
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

      // Exchange code for token on backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/oauth/callback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            code,
            state,
            platform: storedPlatform,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete OAuth flow');
      }

      // Success!
      setStatus('success');
      setMessage(`Successfully connected ${data.username || 'your account'}!`);

      // Clean up session storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_platform');
      sessionStorage.removeItem('oauth_project_id');

      // Redirect to settings after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to connect platform');

      // Clean up session storage even on error
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_platform');
      sessionStorage.removeItem('oauth_project_id');
    }
  };

  const handleRetry = () => {
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
