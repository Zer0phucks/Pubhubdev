# 🚀 DEPLOY THE OAUTH FIX NOW

## The Issue

Your YouTube OAuth is failing because the edge function code changes haven't been deployed to Supabase yet. The browser is receiving an empty callback with no parameters.

## Quick Deploy - Manual Method (5 minutes)

Since you're on Windows, the easiest way is to deploy manually through the Supabase Dashboard:

### Step 1: Copy the Edge Function Code

The updated code is in: `src/supabase/functions/server/index.tsx`

### Step 2: Deploy to Supabase

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/functions
2. **Click on your function** `make-server-19ccd85e` or create it if it doesn't exist
3. **Replace the entire function code** with the contents of `src/supabase/functions/server/index.tsx`
4. **Click "Deploy"**

### Step 3: Verify Environment Variables

Go to: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/settings/secrets

Make sure these are set:

**Critical variables:**
- `FRONTEND_URL` = `https://pubhub.dev`
- `OAUTH_REDIRECT_URL` = `https://pubhub.dev/oauth/callback`

**YouTube specific:**
- `YOUTUBE_CLIENT_ID` = `401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com`
- `YOUTUBE_CLIENT_SECRET` = `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`
- `YOUTUBE_REDIRECT_URI` = `https://pubhub.dev/oauth/callback?platform=youtube`

### Step 4: Update Google Cloud Console

**IMPORTANT**: The redirect URI must match exactly!

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Add this to **Authorized redirect URIs**:
   ```
   https://pubhub.dev/oauth/callback?platform=youtube
   ```
4. **Save**

### Step 5: Test

1. Wait 30-60 seconds for deployment to complete
2. Go to your app: https://pubhub.dev
3. Try connecting YouTube again
4. Check browser console for debug output

## Expected Result

After deployment, the debug console should show:
```
OAuth Callback Debug: 
Object { code: "present", state: "present", platform: "youtube", storedState: "...", url: "..." }
```

## Alternative: Use WSL/Git Bash

If you have Git Bash or WSL installed, you can run:

```bash
./deploy-edge-functions.sh
```

This will automatically deploy the function.




