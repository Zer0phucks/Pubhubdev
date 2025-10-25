import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { PubHubLogo } from './PubHubLogo';

export function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setStatus('error');
          return;
        }

        if (data.session) {
          setStatus('success');
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setError('No session found. Please try signing in again.');
          setStatus('error');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An error occurred during authentication.');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <PubHubLogo className="h-12 w-auto mx-auto mb-4" />
          <CardTitle className="text-emerald-400">
            {status === 'loading' && 'Completing Sign In...'}
            {status === 'success' && 'Welcome to PubHub!'}
            {status === 'error' && 'Sign In Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we complete your authentication.'}
            {status === 'success' && 'You have been successfully signed in. Redirecting to dashboard...'}
            {status === 'error' && 'There was an issue with your sign-in. Please try again.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {status === 'loading' && (
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          )}
          {status === 'error' && (
            <div className="text-center space-y-2">
              <XCircle className="h-8 w-8 text-red-500 mx-auto" />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <button
                onClick={() => navigate('/auth')}
                className="text-sm text-emerald-400 hover:text-emerald-300 underline"
              >
                Return to Sign In
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
