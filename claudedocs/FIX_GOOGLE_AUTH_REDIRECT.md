# 🔧 Fix Google OAuth Redirect to pubhub.dev

## Problem
Google OAuth is redirecting to localhost instead of pubhub.dev after authentication.

## Solution Applied

### 1. ✅ Local Configuration Updated
**File**: `supabase/config.toml`

```toml
[auth]
site_url = "https://pubhub.dev"  # Changed from http://localhost:3000
additional_redirect_urls = [
  "http://localhost:3000",    # For local development
  "http://localhost:3001",    # Alternative local ports
  "http://localhost:3002",
  "https://pubhub.dev",       # Production
  "https://*.vercel.app"      # Vercel preview deployments
]

[auth.external.google]
enabled = true
client_id = "env(YOUTUBE_CLIENT_ID)"
secret = "env(YOUTUBE_CLIENT_SECRET)"
redirect_uri = "https://pubhub.dev/oauth/callback"
```

### 2. ✅ Secrets Set in Supabase
```bash
# Google OAuth credentials set:
GOOGLE_CLIENT_ID=401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 3. ⚠️ MANUAL STEP REQUIRED - Update Supabase Dashboard

**You need to manually update these settings in the Supabase Dashboard:**

#### A. Update URL Configuration
1. Go to: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/auth/url-configuration
2. Set **Site URL** to: `https://pubhub.dev`
3. Add these **Redirect URLs**:
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `http://localhost:3002`
   - `https://pubhub.dev`
   - `https://*.vercel.app`

#### B. Enable Google Provider
1. Go to: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/auth/providers
2. Find **Google** provider and click Configure
3. Toggle **Enable Sign in with Google** to ON
4. Set:
   - **Client ID**: `401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com`
   - **Client Secret**: `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`
5. Save changes

### 4. ✅ Frontend Code Correct
The AuthContext already uses `window.location.origin` which will correctly use:
- `http://localhost:3000` in development
- `https://pubhub.dev` in production

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/oauth/callback`,
    // This dynamically uses the current domain
  }
});
```

## Testing

### Local Development
1. Run `npm run dev`
2. Visit http://localhost:3000 (or 3001/3002)
3. Click "Sign in with Google"
4. Should redirect back to localhost after auth

### Production
1. Visit https://pubhub.dev
2. Click "Sign in with Google"
3. Should redirect back to pubhub.dev after auth

## Important Notes

- The `site_url` in Supabase determines the default redirect URL
- The `additional_redirect_urls` allows other URLs to be used
- Google OAuth uses the same credentials as YouTube (they're both Google services)
- The frontend dynamically uses `window.location.origin` to handle both local and production

## Troubleshooting

If still redirecting to localhost:
1. Clear browser cookies/cache
2. Ensure Supabase Dashboard settings are saved
3. Wait 1-2 minutes for changes to propagate
4. Check browser console for any OAuth errors

## Status
- ✅ Local config updated
- ✅ Secrets configured
- ⚠️ **ACTION REQUIRED**: Update Supabase Dashboard settings manually (links above)