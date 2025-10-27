# Why OAuth Fails Despite Correct Callback URLs

## The Real Problem

While your callback URLs are correctly configured, OAuth is failing because of **backend configuration issues**. Here's why:

## Root Cause Analysis

Looking at the code in `src/supabase/functions/server/index.tsx` lines 1416-1420:

```typescript
if (!config || !config.clientId) {
  return c.json({ 
    error: `OAuth not configured for ${platform}. Please add ${platform.toUpperCase()}_CLIENT_ID and ${platform.toUpperCase()}_CLIENT_SECRET environment variables.` 
  }, 400);
}
```

**This means OAuth will fail if:**
1. The platform's CLIENT_ID environment variable is missing in Supabase Edge Functions
2. The Edge Functions can't access the environment variables
3. The Edge Functions aren't properly deployed

## Why It's Failing

### Issue 1: Edge Function Not Deployed
The OAuth handler is in Supabase Edge Functions, but they might not be deployed or accessible.

**Check if deployed:**
```bash
supabase functions list
```

### Issue 2: Environment Variables Not Set in Supabase
Even though `ENVIRONMENT_VARIABLES_AUDIT.md` shows credentials are set, they might be:
- Set in wrong environment (local vs production)
- Set with wrong naming (case sensitivity)
- Not accessible to Edge Functions

**Check Supabase secrets:**
```bash
supabase secrets list
```

### Issue 3: Wrong Credentials or Expired
The OAuth credentials might be:
- Expired
- Revoked
- Invalid

## How to Debug

### Step 1: Test Edge Function Directly

Try calling the OAuth authorize endpoint directly:

```bash
# Replace with your actual credentials
curl -X GET "https://ykzckfwdvmzuzxhezthv.supabase.co/functions/v1/make-server-19ccd85e/oauth/authorize/twitter?projectId=test" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

**Expected responses:**

✅ **Success** (if working):
```json
{
  "authUrl": "https://twitter.com/i/oauth2/authorize?...",
  "state": "user123:project456:...:..."
}
```

❌ **Failure** (current issue):
```json
{
  "error": "OAuth not configured for twitter. Please add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET environment variables."
}
```

### Step 2: Check Edge Function Logs

1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Click on `make-server-19ccd85e`
4. View logs
5. Look for errors like:
   - "OAuth not configured"
   - "Missing required parameters"
   - "Invalid token"

### Step 3: Verify Environment Variables

Run this check:

```bash
# Check if secrets are set in Supabase
supabase secrets list | grep -i twitter
```

Expected output should include:
```
TWITTER_CLIENT_ID
TWITTER_CLIENT_SECRET
```

## Common Causes

### 1. Secrets Set Locally But Not in Production
**Symptom:** Works locally, fails in production

**Fix:**
```bash
# Set in Supabase production environment
supabase secrets set TWITTER_CLIENT_ID="your_id"
supabase secrets set TWITTER_CLIENT_SECRET="your_secret"
```

### 2. Edge Function Not Up-to-Date
**Symptom:** Changes to code don't reflect in production

**Fix:**
```bash
# Redeploy Edge Functions
supabase functions deploy make-server-19ccd85e
```

### 3. Wrong Redirect URI Mismatch
**Symptom:** OAuth starts but redirect fails

**Check:**
- The redirect URI in your code matches what's registered in the platform's developer console
- No extra `/` or `http` vs `https` mismatch

**Current redirect URI pattern:**
```
https://pubhub.dev/oauth/callback?platform={platform}
```

### 4. CORS Issues
**Symptom:** OAuth callback fails with CORS error

**Fix:** Check Supabase Edge Function CORS settings

### 5. State Parameter Expired
**Symptom:** OAuth starts but callback says "Invalid state"

**Reason:** State tokens expire after 10 minutes

## Immediate Next Steps

### 1. Check Supabase Dashboard
Go to: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/functions

Verify:
- [ ] Edge Function `make-server-19ccd85e` exists
- [ ] It was deployed recently
- [ ] No errors in logs

### 2. Verify Environment Variables
Go to: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/settings/secrets

Check these are set:
- [ ] `TWITTER_CLIENT_ID`
- [ ] `TWITTER_CLIENT_SECRET`
- [ ] `INSTAGRAM_CLIENT_ID`
- [ ] `INSTAGRAM_CLIENT_SECRET`
- [ ] ... (and other platforms)

### 3. Test OAuth Endpoint
Try this in browser console (while signed into PubHub):

```javascript
// Get auth token first
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Test OAuth endpoint
const response = await fetch(
  'https://ykzckfwdvmzuzxhezthv.supabase.co/functions/v1/make-server-19ccd85e/oauth/authorize/twitter?projectId=test',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const result = await response.json();
console.log('OAuth test result:', result);
```

### 4. Check Callback Handler
Open browser console and navigate to:
```
https://pubhub.dev/oauth/callback?code=test&state=test&platform=twitter
```

Look for console errors.

## Quick Fix Checklist

- [ ] Verify Supabase Edge Function is deployed
- [ ] Check environment variables are set in Supabase (not just locally)
- [ ] Test OAuth endpoint directly
- [ ] Check Edge Function logs for errors
- [ ] Verify OAuth credentials are valid and not expired
- [ ] Test with different platform (Twitter, Instagram, etc.)
- [ ] Check Supabase project status (not paused)

## Expected Flow When Working

```
User clicks "Connect Twitter"
  ↓
Frontend calls: /oauth/authorize/twitter
  ↓
Edge Function checks for TWITTER_CLIENT_ID
  ↓
✅ Found → Returns authorization URL
  ↓
User authorizes on Twitter
  ↓
Twitter redirects to: https://pubhub.dev/oauth/callback?code=...
  ↓
OAuthCallback component calls: /oauth/callback
  ↓
Edge Function exchanges code for token
  ↓
✅ Success → User redirected to dashboard
```

## Current Failure Point

Based on the error patterns, the failure is happening at:

**Line 1416-1420**: `if (!config || !config.clientId)`

This means `config.clientId` is undefined, which happens when:
1. Environment variable `TWITTER_CLIENT_ID` (etc.) is not set in Supabase
2. Or the Edge Function can't access it

## Solution

**Run these commands:**

```bash
# 1. List current secrets
supabase secrets list

# 2. Set missing secrets (replace with actual values)
supabase secrets set TWITTER_CLIENT_ID="your_actual_twitter_client_id"
supabase secrets set TWITTER_CLIENT_SECRET="your_actual_twitter_client_secret"

# 3. Repeat for other platforms...
# 4. Redeploy Edge Functions
supabase functions deploy make-server-19ccd85e

# 5. Test
# Try connecting a platform now
```

## Why Callback URLs Work But OAuth Fails

- **Callback URLs are just paths** - they don't need credentials
- **OAuth flow needs credentials** to:
  - Start the authorization process
  - Exchange codes for tokens
  - Store connection data

**Callback = Where to redirect**  
**Credentials = What to authenticate with**

Both are required, but credentials are what's missing!

