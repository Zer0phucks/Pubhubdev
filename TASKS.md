# Next Tasks for Claude

## 🚨 Current Issue: OAuth Fails Despite Correct Callback URLs

**Root Cause**: While callback URLs are properly configured on https://pubhub.dev, OAuth authentication fails because the Supabase Edge Functions cannot access the required CLIENT_ID and CLIENT_SECRET credentials for each platform.

**What Works**:
- ✅ Callback URLs are accessible and handle errors gracefully  
- ✅ UI shows proper error messages  
- ✅ Security measures (CSRF protection) are in place  

**What's Broken**:
- ❌ Backend can't start OAuth flow (missing credentials)
- ❌ Token exchange fails (no CLIENT_SECRET available)
- ❌ Platform connections cannot be established

## 🔧 How to Fix: Follow These 9 Phases

Work through Task 0 below step by step. Each phase builds on the previous one. Don't skip ahead!

---

## 🎯 Priority Tasks

### 0. Fix OAuth Configuration Issues (URGENT)
**Objective**: Diagnose and fix OAuth credential access in Supabase Edge Functions

**Problem**: OAuth callback URLs are correct, but authorization fails because backend can't access CLIENT_ID/CLIENT_SECRET environment variables.

**Phase 1: Diagnosis**
- [ ] Check Edge Function deployment status
  ```bash
  supabase functions list
  ```
- [ ] List all Supabase secrets to see what's configured
  ```bash
  supabase secrets list
  ```
- [ ] Access Supabase Dashboard: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/settings/secrets
- [ ] Check Edge Function logs for errors
  - Go to: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/functions
  - Click on `make-server-19ccd85e`
  - View logs and look for "OAuth not configured" errors
- [ ] Test Edge Function health
  ```bash
  curl -X GET "https://ykzckfwdvmzuzxhezthv.supabase.co/functions/v1/make-server-19ccd85e" \
    -H "Content-Type: application/json"
  ```

**Phase 2: Get OAuth Credentials from Developer Consoles**

Before setting credentials, you need to obtain them from each platform:

- [ ] **Twitter/X** - Get credentials:
  1. Go to https://developer.twitter.com/en/portal/dashboard
  2. Create/Select your app
  3. Navigate to "Keys and tokens"
  4. Get OAuth 2.0 Client ID and Client Secret
  5. Set in Supabase:
  ```bash
  supabase secrets set TWITTER_CLIENT_ID="your_twitter_client_id"
  supabase secrets set TWITTER_CLIENT_SECRET="your_twitter_client_secret"
  ```

- [ ] **Instagram** - Get credentials:
  1. Go to https://developers.facebook.com/apps
  2. Create app or use existing
  3. Add "Instagram Basic Display" product
  4. Get App ID and App Secret
  5. Set in Supabase:
  ```bash
  supabase secrets set INSTAGRAM_CLIENT_ID="your_instagram_app_id"
  supabase secrets set INSTAGRAM_CLIENT_SECRET="your_instagram_app_secret"
  ```

- [ ] **Facebook** - Get credentials:
  1. Go to https://developers.facebook.com/apps
  2. Create app or use existing
  3. Add "Facebook Login" product
  4. Get App ID and App Secret
  5. Set in Supabase:
  ```bash
  supabase secrets set FACEBOOK_APP_ID="your_facebook_app_id"
  supabase secrets set FACEBOOK_APP_SECRET="your_facebook_app_secret"
  ```

- [ ] **LinkedIn** - Get credentials:
  1. Go to https://www.linkedin.com/developers/apps
  2. Create app
  3. Get Client ID and Client Secret
  4. Set in Supabase:
  ```bash
  supabase secrets set LINKEDIN_CLIENT_ID="your_linkedin_client_id"
  supabase secrets set LINKEDIN_CLIENT_SECRET="your_linkedin_client_secret"
  ```

- [ ] **YouTube (Google)** - Get credentials:
  1. Go to https://console.cloud.google.com/
  2. APIs & Services → Credentials
  3. Create OAuth 2.0 Client ID
  4. Get Client ID and Client Secret
  5. Set in Supabase:
  ```bash
  supabase secrets set YOUTUBE_CLIENT_ID="your_youtube_client_id"
  supabase secrets set YOUTUBE_CLIENT_SECRET="your_youtube_client_secret"
  ```

- [ ] **TikTok** - Get credentials:
  1. Go to https://developers.tiktok.com/
  2. Create app
  3. Get Client Key and Client Secret
  4. Set in Supabase:
  ```bash
  supabase secrets set TIKTOK_CLIENT_KEY="your_tiktok_client_key"
  supabase secrets set TIKTOK_CLIENT_SECRET="your_tiktok_client_secret"
  ```

- [ ] **Pinterest** - Get credentials:
  1. Go to https://developers.pinterest.com/
  2. Create app
  3. Get App ID and App Secret
  4. Set in Supabase:
  ```bash
  supabase secrets set PINTEREST_APP_ID="your_pinterest_app_id"
  supabase secrets set PINTEREST_APP_SECRET="your_pinterest_app_secret"
  ```

- [ ] **Reddit** - Get credentials:
  1. Go to https://www.reddit.com/prefs/apps
  2. Click "create another app"
  3. Get Client ID and Client Secret
  4. Set in Supabase:
  ```bash
  supabase secrets set REDDIT_CLIENT_ID="your_reddit_client_id"
  supabase secrets set REDDIT_CLIENT_SECRET="your_reddit_client_secret"
  ```

**Phase 3: Verify Existing Credentials**
- [ ] Check which credentials are already set:
  ```bash
  supabase secrets list
  ```
- [ ] Document missing credentials for platforms not yet configured
- [ ] Note: TikTok, Pinterest, and Reddit may already be configured according to audit

**Phase 4: Set Redirect URIs**
- [ ] Set redirect URIs for all platforms (if not auto-configured):
  ```bash
  # These should use your production URL
  supabase secrets set TWITTER_REDIRECT_URI="https://pubhub.dev/oauth/callback?platform=twitter"
  supabase secrets set INSTAGRAM_REDIRECT_URI="https://pubhub.dev/oauth/callback?platform=instagram"
  supabase secrets set FACEBOOK_REDIRECT_URI="https://pubhub.dev/oauth/callback?platform=facebook"
  supabase secrets set LINKEDIN_REDIRECT_URI="https://pubhub.dev/oauth/callback?platform=linkedin"
  supabase secrets set YOUTUBE_REDIRECT_URI="https://pubhub.dev/oauth/callback?platform=youtube"
  supabase secrets set TIKTOK_REDIRECT_URI="https://pubhub.dev/oauth/callback?platform=tiktok"
  supabase secrets set PINTEREST_REDIRECT_URI="https://pubhub.dev/oauth/callback?platform=pinterest"
  supabase secrets set REDDIT_REDIRECT_URI="https://pubhub.dev/oauth/callback?platform=reddit"
  ```

**Phase 5: Set Frontend URL**
- [ ] Set production frontend URL:
  ```bash
  supabase secrets set FRONTEND_URL="https://pubhub.dev"
  supabase secrets set OAUTH_REDIRECT_URL="https://pubhub.dev/oauth/callback"
  ```

**Phase 6: Redeploy Edge Functions**
- [ ] Redeploy the Edge Function to pick up new environment variables:
  ```bash
  cd supabase/functions
  supabase functions deploy make-server-19ccd85e
  ```
- [ ] Verify deployment success:
  ```bash
  supabase functions list
  ```

**Phase 7: Verify Configuration**
- [ ] Test OAuth authorization endpoint for each platform:
  ```bash
  # First, get an auth token by signing into the app
  # Then test the endpoint:
  curl -X GET "https://ykzckfwdvmzuzxhezthv.supabase.co/functions/v1/make-server-19ccd85e/oauth/authorize/twitter?projectId=test" \
    -H "Authorization: Bearer YOUR_AUTH_TOKEN"
  ```
- [ ] Check that response returns `authUrl` instead of error
- [ ] Repeat for all 8 platforms

**Phase 8: Register Callback URLs in Developer Consoles**
- [ ] **Twitter Developer Portal** (https://developer.twitter.com/en/portal/dashboard): 
  - Add callback URL: `https://pubhub.dev/oauth/callback?platform=twitter`
- [ ] **Facebook Developers** (https://developers.facebook.com/apps): 
  - Add callback URL: `https://pubhub.dev/oauth/callback?platform=facebook`
- [ ] **Instagram (same as Facebook)**: 
  - Add callback URL: `https://pubhub.dev/oauth/callback?platform=instagram`
- [ ] **LinkedIn Developer Console** (https://www.linkedin.com/developers/apps): 
  - Add callback URL: `https://pubhub.dev/oauth/callback?platform=linkedin`
- [ ] **Google Cloud Console** (https://console.cloud.google.com/apis/credentials): 
  - Add callback URL: `https://pubhub.dev/oauth/callback?platform=youtube`
- [ ] **TikTok Developer Portal** (https://developers.tiktok.com/): 
  - Add callback URL: `https://pubhub.dev/oauth/callback?platform=tiktok`
- [ ] **Pinterest Developers** (https://developers.pinterest.com/): 
  - Add callback URL: `https://pubhub.dev/oauth/callback?platform=pinterest`
- [ ] **Reddit App Console** (https://www.reddit.com/prefs/apps): 
  - Add callback URL: `https://pubhub.dev/oauth/callback?platform=reddit`

**Phase 9: End-to-End Testing**
- [ ] Test each platform's OAuth flow manually:
  1. Navigate to Project Settings → Connections
  2. Click "Connect" on platform
  3. Complete OAuth authorization
  4. Verify redirect back to app
  5. Confirm platform shows as "Connected"
  6. Test posting to platform (if applicable)

**Why Urgent**: Users can't connect any social media platforms until this is fixed

**Resources**:
- Detailed explanation: `OAUTH_FAILURE_ROOT_CAUSE.md`
- Verification results: `OAUTH_CALLBACK_VERIFICATION_SUMMARY.md`
- Quick reference: `WHY_OAUTH_FAILS_EXPLAINED.md`

---

### 1. End-to-End OAuth Flow Testing
**Objective**: Manually test and verify OAuth flow for each platform

**Tasks**:
- [ ] Test Twitter/X OAuth flow from start to finish
- [ ] Test Instagram OAuth flow end-to-end
- [ ] Test LinkedIn OAuth flow end-to-end
- [ ] Test Facebook OAuth flow end-to-end
- [ ] Test YouTube OAuth flow end-to-end
- [ ] Test TikTok OAuth flow end-to-end
- [ ] Test Pinterest OAuth flow end-to-end
- [ ] Test Reddit OAuth flow end-to-end

**Expected Outcome**: Document any issues found, verify tokens are stored correctly, and confirm platform connections appear in settings

**Why Important**: While the callback URLs are verified, we need to ensure the complete OAuth flow works from authorization initiation to token storage

---

### 2. OAuth Connection Status Monitoring
**Objective**: Add monitoring and health checks for OAuth connections

**Tasks**:
- [ ] Create a health check endpoint that validates stored OAuth tokens
- [ ] Add token expiry detection and automatic refresh
- [ ] Build a connection status dashboard showing:
  - Which platforms are connected
  - Token validity status
  - Last token refresh time
  - Expiring tokens warnings

**Implementation Details**:
```typescript
// Add to: src/supabase/functions/server/index.tsx
app.get("/make-server-19ccd85e/oauth/health", async (c) => {
  // Check all platform tokens
  // Return status for each platform
});
```

**Why Important**: Prevents silent OAuth failures and alerts users when tokens need refresh

---

### 3. Secure Token Rotation & Refresh
**Objective**: Implement automatic token refresh for all platforms

**Tasks**:
- [ ] Implement refresh token logic for each platform
- [ ] Add background job to refresh tokens before expiry
- [ ] Handle token revocation gracefully
- [ ] Update UI to show when tokens are being refreshed

**Platforms Needing Refresh Support**:
- Twitter (already has refresh tokens)
- LinkedIn
- Facebook
- YouTube (Google)
- Instagram

**Why Important**: Prevents "token expired" errors during posting

---

### 4. OAuth Connection Analytics
**Objective**: Track OAuth success/failure rates

**Tasks**:
- [ ] Add telemetry to track:
  - OAuth initiation attempts
  - Successful connections
  - Failed connections (with error types)
  - Connection duration
  - Platform usage patterns
- [ ] Create dashboard showing OAuth health metrics
- [ ] Alert on high failure rates

**Why Important**: Helps identify and fix OAuth issues proactively

---

### 5. Enhanced Error Messages
**Objective**: Provide better user feedback for common OAuth failures

**Tasks**:
- [ ] Detect specific OAuth error types:
  - Invalid credentials
  - Token expired
  - Scope issues
  - Rate limiting
  - Network errors
- [ ] Provide actionable error messages
- [ ] Add troubleshooting links for common issues

**Why Important**: Reduces support burden and improves user experience

---

### 6. Platform Connection Testing Suite
**Objective**: Automate testing of platform connections

**Tasks**:
- [ ] Create Playwright test that:
  - Simulates OAuth flow
  - Verifies token storage
  - Tests connection status checks
  - Validates posting capabilities
- [ ] Add to CI/CD pipeline
- [ ] Run daily health checks

**Why Important**: Catches OAuth issues before users do

---

## 🚀 Bonus Tasks

### 7. Multi-Account Support Per Platform
Allow users to connect multiple accounts per platform

### OAuth Token Security Audit
Review token storage security, encryption, and access controls

### OAuth Connection Backup/Restore
Allow users to export/import OAuth connections

---

## Current Status

✅ **Completed**:
- OAuth callback URLs verified for all 8 platforms
- Error handling implemented
- Security measures in place
- Documentation created

🔄 **In Progress**: None

⏳ **Pending**: Tasks listed above

---

**Note**: Focus on tasks 1-3 first as they're critical for production readiness!
