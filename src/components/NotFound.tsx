import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { PubHubLogo } from "./PubHubLogo";

interface NotFoundProps {
  onNavigate?: (view: string) => void;
}

export function NotFound({ onNavigate }: NotFoundProps) {
  const handleHomeClick = () => {
    if (onNavigate) {
      onNavigate("project-overview");
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      {/* Logo */}
      <PubHubLogo className="h-16 w-auto mb-8 opacity-50" />

      {/* Error Code */}
      <h1 className="text-9xl font-bold text-emerald-500 mb-4">404</h1>

      {/* Error Message */}
      <h2 className="text-3xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you may have mistyped the URL.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleHomeClick}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>

      {/* Help Text */}
      <div className="mt-12 text-sm text-muted-foreground">
        <p>Need help?</p>
        <a
          href="mailto:support@pubhub.dev"
          className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}