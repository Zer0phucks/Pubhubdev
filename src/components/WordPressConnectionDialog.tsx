import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { ExternalLink, Loader2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { logger } from '../utils/logger';

interface WordPressConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (credentials: WordPressCredentials) => Promise<void>;
}

export interface WordPressCredentials {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

export function WordPressConnectionDialog({
  open,
  onOpenChange,
  onConnect,
}: WordPressConnectionDialogProps) {
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [applicationPassword, setApplicationPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleConnect = async () => {
    // Validation
    if (!siteUrl.trim()) {
      toast.error("Please enter your WordPress site URL");
      return;
    }
    if (!username.trim()) {
      toast.error("Please enter your WordPress username");
      return;
    }
    if (!applicationPassword.trim()) {
      toast.error("Please enter your Application Password");
      return;
    }

    // Ensure URL has protocol
    let formattedUrl = siteUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Remove trailing slash
    formattedUrl = formattedUrl.replace(/\/$/, '');

    try {
      setLoading(true);
      await onConnect({
        siteUrl: formattedUrl,
        username: username.trim(),
        applicationPassword: applicationPassword.trim().replace(/\s/g, ''), // Remove any spaces
      });

      // Reset form on success
      setSiteUrl("");
      setUsername("");
      setApplicationPassword("");
      onOpenChange(false);
    } catch (error: any) {
      logger.error('WordPress connection error:', error);
      toast.error(error.message || "Failed to connect to WordPress");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect WordPress Blog</DialogTitle>
          <DialogDescription>
            Enter your WordPress site credentials to enable publishing from PubHub
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            <HelpCircle className="w-3 h-3 mr-2" />
            {showInstructions ? "Hide" : "Show"} Setup Instructions
          </Button>

          {/* Instructions */}
          {showInstructions && (
            <Alert>
              <AlertDescription className="text-xs space-y-2">
                <p className="font-semibold">How to get your Application Password:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Log in to your WordPress admin panel</li>
                  <li>Go to Users → Profile</li>
                  <li>Scroll down to "Application Passwords"</li>
                  <li>Enter "PubHub" as the name and click "Add New Application Password"</li>
                  <li>Copy the generated password (shown only once!)</li>
                </ol>
                <p className="text-muted-foreground mt-2">
                  Note: Application Passwords require WordPress 5.6+ and HTTPS
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Site URL */}
          <div className="space-y-2">
            <Label htmlFor="site-url">WordPress Site URL</Label>
            <Input
              id="site-url"
              placeholder="https://yourblog.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Your WordPress site address (e.g., yourblog.com or blog.yoursite.com)
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">WordPress Username</Label>
            <Input
              id="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Your WordPress admin username
            </p>
          </div>

          {/* Application Password */}
          <div className="space-y-2">
            <Label htmlFor="app-password">Application Password</Label>
            <Input
              id="app-password"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              value={applicationPassword}
              onChange={(e) => setApplicationPassword(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Generated from WordPress → Users → Profile → Application Passwords
            </p>
          </div>

          {/* Security Note */}
          <Alert>
            <AlertDescription className="text-xs">
              🔒 Your credentials are encrypted and stored securely. PubHub will only use them to publish content on your behalf.
            </AlertDescription>
          </Alert>

          {/* Documentation Link */}
          <Button
            variant="link"
            size="sm"
            className="w-full text-xs"
            onClick={() => window.open('https://wordpress.org/support/article/application-passwords/', '_blank')}
          >
            <ExternalLink className="w-3 h-3 mr-2" />
            WordPress Application Passwords Documentation
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>Connect WordPress</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
