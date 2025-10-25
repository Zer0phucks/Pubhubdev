import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  FileText,
  HelpCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';

export function OAuthQuickHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="w-4 h-4 mr-2" />
          Quick Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>OAuth Testing Quick Help</DialogTitle>
          <DialogDescription>
            Common issues, quick fixes, and helpful tips for OAuth testing
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quickstart" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="issues">Common Issues</TabsTrigger>
            <TabsTrigger value="tips">Pro Tips</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="quickstart" className="space-y-4 pr-4">
              <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
                <h4 className="mb-3 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Getting Started (3 Steps)
                </h4>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">Run Diagnostics</p>
                      <p className="text-sm text-muted-foreground">
                        Click "Run Diagnostics" at the top to check your setup
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">Fix Any Issues</p>
                      <p className="text-sm text-muted-foreground">
                        Follow suggestions to resolve configuration problems
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">Test a Platform</p>
                      <p className="text-sm text-muted-foreground">
                        Select a platform tab and click "Test OAuth Flow"
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="mb-3">Platform Testing Order</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Test platforms in this order (easiest to hardest):
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 justify-center">1</Badge>
                    <span>Twitter/X - Most straightforward OAuth 2.0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 justify-center">2</Badge>
                    <span>LinkedIn - Similar to Twitter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 justify-center">3</Badge>
                    <span>Reddit - Simpler API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 justify-center">4</Badge>
                    <span>Facebook - More complex setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 justify-center">5</Badge>
                    <span>Instagram - Requires Facebook</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 justify-center">6</Badge>
                    <span>YouTube - Requires Google Cloud</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 justify-center">7</Badge>
                    <span>Pinterest - Requires app approval</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 justify-center">8</Badge>
                    <span>TikTok - Requires production approval</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="mb-3">Environment Variables Template</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Add these to Supabase → Settings → Edge Functions:
                </p>
                <div className="bg-black/20 rounded p-3 font-mono text-xs space-y-1">
                  <div className="text-muted-foreground"># Frontend URL</div>
                  <div>FRONTEND_URL=https://pubhub.dev</div>
                  <div className="text-muted-foreground mt-2"># Platform Credentials</div>
                  <div>TWITTER_CLIENT_ID=your_client_id</div>
                  <div>TWITTER_CLIENT_SECRET=your_client_secret</div>
                  <div>TWITTER_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/twitter</div>
                  <div className="text-muted-foreground mt-2"># Repeat for each platform...</div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4 pr-4">
              <Card className="p-4 border-red-500/20 bg-red-500/5">
                <h4 className="mb-3 text-red-400 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  "Environment variables not configured"
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">This means OAuth credentials are missing.</p>
                  <p className="font-medium">Fix:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Go to Supabase Dashboard</li>
                    <li>Navigate to Project Settings → Edge Functions</li>
                    <li>Add the required CLIENT_ID and CLIENT_SECRET</li>
                    <li>Redeploy the edge function</li>
                    <li>Click "Refresh All" in OAuth Tester</li>
                  </ol>
                </div>
              </Card>

              <Card className="p-4 border-red-500/20 bg-red-500/5">
                <h4 className="mb-3 text-red-400 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  "Invalid redirect URI"
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">The redirect URI doesn't match the platform's settings.</p>
                  <p className="font-medium">Fix:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Check FRONTEND_URL is set correctly</li>
                    <li>Verify redirect URI in platform's developer console</li>
                    <li>Ensure exact match (including https://)</li>
                    <li>Update platform settings if needed</li>
                  </ol>
                </div>
              </Card>

              <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                <h4 className="mb-3 text-yellow-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  "Failed to fetch user info"
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Usually a non-critical warning.</p>
                  <p className="font-medium">Fix (optional):</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Check platform API permissions in dev console</li>
                    <li>Verify required scopes are enabled</li>
                    <li>Connection may still work for posting</li>
                    <li>This often doesn't require fixing</li>
                  </ol>
                </div>
              </Card>

              <Card className="p-4 border-red-500/20 bg-red-500/5">
                <h4 className="mb-3 text-red-400 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  "Token exchange failed"
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">The OAuth code couldn't be exchanged for a token.</p>
                  <p className="font-medium">Fix:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Verify CLIENT_ID and CLIENT_SECRET are correct</li>
                    <li>Check if platform API is operational</li>
                    <li>Review backend logs for detailed error</li>
                    <li>Ensure redirect_uri matches exactly</li>
                  </ol>
                </div>
              </Card>

              <Card className="p-4 border-red-500/20 bg-red-500/5">
                <h4 className="mb-3 text-red-400 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  "Invalid state" or "State mismatch"
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">CSRF protection state doesn't match.</p>
                  <p className="font-medium">Fix:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Clear browser sessionStorage</li>
                    <li>Try the OAuth flow again</li>
                    <li>Enable cookies if disabled</li>
                    <li>Check if backend state storage is working</li>
                  </ol>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tips" className="space-y-4 pr-4">
              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <h4 className="mb-3 text-blue-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Use Diagnostics First
                </h4>
                <p className="text-sm text-muted-foreground">
                  Always run "Run Diagnostics" before testing individual platforms. 
                  It automatically checks your configuration and shows exactly what needs fixing.
                </p>
              </Card>

              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <h4 className="mb-3 text-blue-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Copy Logs Before Making Changes
                </h4>
                <p className="text-sm text-muted-foreground">
                  Click "Copy" to save logs before trying fixes. This helps you track what worked 
                  and what didn't. You can paste them in a text file for reference.
                </p>
              </Card>

              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <h4 className="mb-3 text-blue-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Test in Incognito Mode
                </h4>
                <p className="text-sm text-muted-foreground">
                  Use incognito/private browsing for a clean OAuth flow test. This eliminates 
                  issues from cached credentials or cookies.
                </p>
              </Card>

              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <h4 className="mb-3 text-blue-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Check Backend Logs
                </h4>
                <p className="text-sm text-muted-foreground">
                  For detailed errors, check Supabase Dashboard → Edge Functions → Logs. 
                  Backend logs show the full error messages from OAuth providers.
                </p>
              </Card>

              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <h4 className="mb-3 text-blue-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Use Browser Dev Tools
                </h4>
                <p className="text-sm text-muted-foreground">
                  Open browser developer tools (F12) and check the Network tab to see 
                  all API requests. Look for failed requests or unexpected redirects.
                </p>
              </Card>

              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <h4 className="mb-3 text-blue-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Verify Platform Settings
                </h4>
                <p className="text-sm text-muted-foreground">
                  Keep the platform's developer console open in another tab. Verify your 
                  app settings, redirect URIs, and permissions while testing.
                </p>
              </Card>

              <Card className="p-4 bg-purple-500/10 border-purple-500/20">
                <h4 className="mb-3 text-purple-400 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentation Available
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Comprehensive guides are available:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>OAUTH_QUICK_START.md - Fast setup</li>
                    <li>OAUTH_TESTING_GUIDE.md - Detailed guide</li>
                    <li>OAUTH_TESTING_CHECKLIST.md - Step-by-step</li>
                    <li>OAUTH_SETUP.md - Platform setup</li>
                  </ul>
                </div>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open('https://developer.twitter.com', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Platform Docs
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
