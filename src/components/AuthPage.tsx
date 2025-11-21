import { useState } from "react";
import { useAuth } from "./AuthContext";
import { PubHubLogo } from "./PubHubLogo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { Separator } from "./ui/separator";
import { logger } from '../utils/logger';
import { toAppError } from '@/types';

export function AuthPage() {
  // Default to sign up for first-time users
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { signin, signup } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }
    
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await signin(email.trim(), password);
    } catch (err: unknown) {
      const error = toAppError(err);
      logger.error("Sign in error:", error);
      
      const errorMsg = (err.message || '').toLowerCase();
      
      // Handle common Supabase auth errors with helpful messages
      if (errorMsg.includes('invalid login credentials') || 
          errorMsg.includes('invalid password')) {
        // Check if this might be a new user
        setError("Invalid email or password. If you don't have an account yet, please sign up.");
      } else if (errorMsg.includes('email not confirmed')) {
        setSuccess("Please check your email and click the confirmation link before signing in.");
        setError("");
      } else if (errorMsg.includes('user not found') || 
                 errorMsg.includes('no account')) {
        setError("No account found with this email. Please sign up first.");
      } else if (errorMsg.includes('too many requests')) {
        setError("Too many login attempts. Please wait a few minutes and try again.");
      } else {
        setError(err.message || "Failed to sign in. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!name || name.trim().length === 0) {
      setError("Please enter your name.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await signup(email.trim(), password, name.trim());
    } catch (err: unknown) {
      const error = toAppError(err);
      logger.error("Sign up error:", error);
      
      const errorMessage = (err.message || '').toLowerCase();
      
      // Handle common Supabase auth errors
      if (errorMessage.includes('already') || 
          errorMessage.includes('registered') ||
          errorMessage.includes('exists')) {
        // Switch to sign-in mode and show helpful message
        setIsSignUp(false);
        setPassword(''); // Clear password for security
        setError("This email is already registered. Please sign in below.");
      } else if (errorMessage.includes('check your email') || 
                 errorMessage.includes('confirm')) {
        // Email confirmation required
        setSuccess("Account created! Please check your email to confirm your account before signing in.");
        setIsSignUp(false);
        setPassword(''); // Clear password for security
      } else if (errorMessage.includes('password')) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to sign up. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <PubHubLogo className="h-12 w-auto mx-auto mb-4" />
          <CardTitle className="text-emerald-400">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Sign up to start managing your content"
              : "Sign in to your account"}
          </CardDescription>
          
          {/* First-time user hint */}
          {!isSignUp && (
            <Alert className="mt-4 border-emerald-500/50 bg-emerald-500/10 text-left">
              <AlertCircle className="h-4 w-4 text-emerald-400" />
              <AlertDescription className="text-sm text-muted-foreground">
                <strong className="text-foreground">First time here?</strong> You need to create an account first.{" "}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-emerald-400 hover:text-emerald-300 underline"
                  onClick={() => {
                    setIsSignUp(true);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Click here to sign up
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          <CardContent className="space-y-4">
            {success && (
              <Alert className="border-emerald-500/50 bg-emerald-500/10">
                <AlertCircle className="h-4 w-4 text-emerald-400" />
                <AlertDescription className="text-foreground">
                  {success}
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  {error.includes("No account found") && !isSignUp && (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 ml-1 text-destructive-foreground underline"
                      onClick={() => {
                        setIsSignUp(true);
                        setError("");
                        setSuccess("");
                      }}
                    >
                      Create an account instead?
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  autoComplete="name"
                  autoFocus={isSignUp}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus={!isSignUp}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
              {isSignUp && (
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters long
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            {/* OAuth Providers */}
            <div className="w-full space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Google */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10"
                  asChild
                >
                  <a href="/sign-in?oauth=google" aria-label="Sign in with Google">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                    </svg>
                  </a>
                </Button>

                {/* Facebook */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10"
                  asChild
                >
                  <a href="/sign-in?oauth=facebook" aria-label="Sign in with Facebook">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </Button>

                {/* Twitter */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10"
                  asChild
                >
                  <a href="/sign-in?oauth=twitter" aria-label="Sign in with Twitter">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1DA1F2">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                </Button>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
                setEmail("");
                setPassword("");
                setName("");
              }}
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </Button>

            {/* Terms and Privacy Links */}
            <div className="text-center text-xs text-muted-foreground">
              By {isSignUp ? "signing up" : "signing in"}, you agree to our{" "}
              <a
                href="/terms"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
