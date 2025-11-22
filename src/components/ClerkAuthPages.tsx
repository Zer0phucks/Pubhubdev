import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SignIn, SignUp, useSignIn } from "@clerk/clerk-react";

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

export function ClerkSignInPage() {
  const { signIn, isLoaded } = useSignIn();
  const [searchParams] = useSearchParams();
  const [oauthError, setOauthError] = useState<string | null>(null);
  const hasAttemptedRef = useRef(false);

  const strategy = useMemo(() => {
    const provider = searchParams.get("oauth");
    if (!provider) return null;
    const map: Record<string, string> = {
      google: "oauth_google",
      facebook: "oauth_facebook",
      twitter: "oauth_twitter",
    };
    return map[provider.toLowerCase()] ?? null;
  }, [searchParams]);

  useEffect(() => {
    if (!strategy || !signIn || !isLoaded || hasAttemptedRef.current) {
      return;
    }

    hasAttemptedRef.current = true;
    setOauthError(null);

    signIn
      .authenticateWithRedirect({
        strategy,
        fallbackRedirectUrl: "/auth/callback",
        redirectUrl: "/dashboard",
      })
      .catch((error) => {
        console.error("[PubHub] Clerk OAuth redirect failed", error);
        setOauthError("We couldn't start the OAuth flow. Please use the buttons below.");
        hasAttemptedRef.current = false;
      });
  }, [strategy, signIn, isLoaded]);

  return (
    <AuthShell>
      {oauthError && (
        <div className="mb-4 rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {oauthError}
        </div>
      )}
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}

export function ClerkSignUpPage() {
  return (
    <AuthShell>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}


