# Deploy Edge Function Fix

## Problem
The YouTube OAuth is failing because the edge function hasn't been deployed with the recent fixes.

## Solution: Deploy the Edge Function

You need to deploy the updated edge function to Supabase. Here are the options:

### Option 1: Using Supabase CLI (Recommended)

```bash
# First, make sure you have the Supabase CLI installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ykzckfwdvmzuzxhezthv

# Deploy the edge function
supabase functions deploy make-server-19ccd85e
```

### Option 2: Manual Deployment via Dashboard

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/functions
2. Click "Create a new function" or edit `make-server-19ccd85e`
3. Copy the contents of `src/supabase/functions/server/index.tsx`
4. Paste into the function editor
5. Click "Deploy"

### Option 3: Using the Push Script (if available)

If you have the push script:

```bash
# Make sure you're in the project root
cd C:\Users\nsnfr\Pubhubdev

# Run the deployment
./deploy-edge-functions.sh
```

## After Deployment

1. Wait 30-60 seconds for the function to deploy
2. Try the OAuth flow again
3. Check the browser console for the debug output

## Expected Redirect URL

After deployment, the redirect URI sent to YouTube should be:
```
https://pubhub.dev/oauth/callback?platform=youtube
```

Make sure this exact URL is registered in Google Cloud Console:
- Go to: https://console.cloud.google.com/apis/credentials
- Find your OAuth 2.0 Client ID
- Edit it
- Add to Authorized redirect URIs:
  - `https://pubhub.dev/oauth/callback?platform=youtube`

## Verify Deployment

To verify the deployment worked, check the debug console output. You should now see:
```
OAuth Callback Debug: 
Object { code: "present", state: "present", platform: "youtube", ... }
```

If you still see "missing" for code and state, then the redirect URL in Google Cloud Console doesn't match what's being sent.




