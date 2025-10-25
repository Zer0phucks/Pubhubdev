import { useState } from "react";
import { useAuth } from "./AuthContext";
import { PubHubLogo } from "./PubHubLogo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

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
    } catch (err: any) {
      console.error("Sign in error:", err);
      
      // Handle common Supabase auth errors
      if (err.message?.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (err.message?.includes("Email not confirmed")) {
        setError("Please confirm your email address before signing in.");
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
    } catch (err: any) {
      console.error("Sign up error:", err);
      
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
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
