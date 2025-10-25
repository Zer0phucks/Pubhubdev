# OAuth Platform Integration Testing Guide

## Overview

This guide provides comprehensive testing procedures for OAuth integrations in PubHub. It covers all supported platforms and includes debugging tools and common issue resolutions.

## Current Implementation Status

### ✅ Fully Implemented Components

1. **Backend OAuth Routes** (`/src/supabase/functions/server/index.tsx`)
   - `GET /oauth/authorize/:platform` - Generate authorization URLs
   - `POST /oauth/callback` - Handle OAuth callbacks and token exchange
   - `POST /oauth/disconnect` - Disconnect platforms
   - `GET /oauth/token/:platform/:projectId` - Retrieve access tokens

2. **Frontend Components**
   - `PlatformConnections.tsx` - Main connections management UI
   - `OAuthCallback.tsx` - OAuth callback handler
   - `OAuthDebugDashboard.tsx` - Debug dashboard for testing

3. **Security Features**
   - CSRF protection with state parameter
   - Token storage in backend KV store
   - Automatic token refresh
   - Per-project connection scoping

## Testing Tools

### 1. Command-Line Test Script

**Location**: `/scripts/test-oauth.js`

**Usage**:
```bash
cd /home/noob/credpair/Pubhubdev
node scripts/test-oauth.js
```

**Features**:
- Tests OAuth configuration for all platforms
- Verifies environment variables
- Checks authorization URLs
- Validates API endpoints
- Generates detailed test reports

### 2. OAuth Debug Dashboard

**Component**: `OAuthDebugDashboard.tsx`

**How to Enable**:
1. Import the component in your App.tsx or Settings component
2. Add a debug route or toggle to display it

```tsx
import { OAuthDebugDashboard } from './components/OAuthDebugDashboard';

// In your settings or admin view
{showDebugDashboard && <OAuthDebugDashboard />}
```

**Features**:
- Real-time OAuth status monitoring
- Platform configuration validation
- Test OAuth flow button for each platform
- Copy debug info to clipboard
- Direct links to developer documentation

## Testing Procedures

### Step 1: Environment Configuration

Before testing OAuth, ensure environment variables are set in Supabase:

```bash
# Check if environment variables are configured
supabase secrets list
```

Required variables per platform:

| Platform | Client ID Variable | Client Secret Variable |
|----------|-------------------|----------------------|
| Twitter | TWITTER_CLIENT_ID | TWITTER_CLIENT_SECRET |
| Instagram | INSTAGRAM_CLIENT_ID | INSTAGRAM_CLIENT_SECRET |
| LinkedIn | LINKEDIN_CLIENT_ID | LINKEDIN_CLIENT_SECRET |
| Facebook | FACEBOOK_APP_ID | FACEBOOK_APP_SECRET |
| YouTube | YOUTUBE_CLIENT_ID | YOUTUBE_CLIENT_SECRET |
| TikTok | TIKTOK_CLIENT_KEY | TIKTOK_CLIENT_SECRET |
| Pinterest | PINTEREST_APP_ID | PINTEREST_APP_SECRET |
| Reddit | REDDIT_CLIENT_ID | REDDIT_CLIENT_SECRET |

Also required:
```
FRONTEND_URL=https://your-app.com
```

### Step 2: Test Authorization URL Generation

For each platform, test that authorization URLs are generated correctly:

```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  "https://YOUR_PROJECT.supabase.co/functions/v1/make-server-19ccd85e/oauth/authorize/twitter?projectId=YOUR_PROJECT_ID"
```

Expected response:
```json
{
  "authUrl": "https://twitter.com/i/oauth2/authorize?client_id=...",
  "state": "userId:projectId:timestamp:random"
}
```

### Step 3: Test OAuth Flow

1. **Start Connection**:
   - Navigate to Project Settings → Connections
   - Click "Connect" on a platform
   - Verify redirect to platform's OAuth page

2. **Authorize Application**:
   - Log in to the platform (if needed)
   - Grant permissions to PubHub
   - Verify redirect back to `/oauth/callback`

3. **Verify Callback Handling**:
   - Check for success message
   - Verify platform shows as "Connected"
   - Check username is displayed

### Step 4: Test Token Storage

Check that tokens are properly stored:

```sql
-- In Supabase SQL Editor (this is a conceptual query - adjust based on your KV implementation)
SELECT * FROM kv_store WHERE key LIKE 'oauth:token:%';
```

### Step 5: Test Disconnection

1. Click "Disconnect" on a connected platform
2. Confirm disconnection
3. Verify platform shows as available to connect again
4. Check tokens are removed from storage

## Debugging Common Issues

### Issue 1: "OAuth not configured" Error

**Symptoms**: Error message when clicking Connect

**Solutions**:
1. Check environment variables are set correctly
2. Restart Supabase Edge Functions after adding variables
3. Verify variable names match exactly (case-sensitive)

```bash
# Set environment variables
supabase secrets set TWITTER_CLIENT_ID=your_client_id
supabase secrets set TWITTER_CLIENT_SECRET=your_client_secret

# Restart functions
supabase functions deploy make-server-19ccd85e
```

### Issue 2: "Invalid redirect URI" Error

**Symptoms**: Platform returns error about redirect URI

**Solutions**:
1. Verify redirect URI in platform developer console matches exactly:
   ```
   https://your-app.com/oauth/callback
   ```
2. Some platforms require the query parameter:
   ```
   https://your-app.com/oauth/callback?platform=twitter
   ```
3. Ensure using HTTPS in production

### Issue 3: "Invalid state" Error

**Symptoms**: Callback fails with state validation error

**Solutions**:
1. Check session storage is working
2. Verify state isn't expired (10-minute timeout)
3. Ensure same browser session throughout flow

### Issue 4: Token Exchange Fails

**Symptoms**: Callback fails during token exchange

**Solutions**:
1. Verify client secret is correct
2. Check platform app is not in sandbox mode
3. Ensure required permissions are granted
4. Check API rate limits

### Issue 5: CORS Errors

**Symptoms**: Network errors in browser console

**Solutions**:
1. Check CORS configuration in Edge Function
2. Verify origin is allowed
3. Ensure preflight requests are handled

## Platform-Specific Testing Notes

### Twitter/X
- Requires OAuth 2.0 with PKCE
- Test with both personal and developer accounts
- Verify tweet posting permissions

### Instagram
- Requires Instagram Business Account
- Must be connected to Facebook Page
- Test media upload separately

### LinkedIn
- Test with both personal and company pages
- Verify member vs organization posting

### Facebook
- Requires Facebook Page (not personal profile)
- Test page selection if multiple pages

### YouTube
- Uses Google OAuth
- Test video upload permissions
- Check quota limits

### TikTok
- Requires app review for production
- Test in sandbox mode first
- Video upload requires separate flow

### Pinterest
- Test board selection
- Verify pin creation permissions

### Reddit
- Test subreddit selection
- Verify karma requirements

## Monitoring and Logs

### View Edge Function Logs

```bash
# Real-time logs
supabase functions logs make-server-19ccd85e --tail

# Filter OAuth-related logs
supabase functions logs make-server-19ccd85e | grep -i oauth
```

### Browser DevTools

1. **Network Tab**:
   - Monitor OAuth requests
   - Check for failed requests
   - Verify token exchange

2. **Console**:
   - Check for JavaScript errors
   - View debug messages
   - Monitor state changes

3. **Application Tab**:
   - Check sessionStorage for OAuth state
   - Verify localStorage for auth tokens

## Testing Checklist

- [ ] **Environment Setup**
  - [ ] All platform credentials added to Supabase
  - [ ] FRONTEND_URL configured
  - [ ] Edge Functions deployed

- [ ] **Authorization Flow**
  - [ ] Authorization URL generates successfully
  - [ ] Redirect to platform works
  - [ ] State parameter is stored

- [ ] **Callback Handling**
  - [ ] Code exchange works
  - [ ] Tokens are stored
  - [ ] User info is fetched
  - [ ] UI updates correctly

- [ ] **Token Management**
  - [ ] Access tokens are stored securely
  - [ ] Refresh tokens work (where applicable)
  - [ ] Token expiry is handled

- [ ] **Disconnection**
  - [ ] Disconnect removes tokens
  - [ ] UI updates correctly
  - [ ] Can reconnect after disconnect

- [ ] **Error Handling**
  - [ ] Missing credentials show helpful error
  - [ ] Invalid state is caught
  - [ ] Network errors are handled gracefully
  - [ ] User gets clear feedback

## Production Deployment Checklist

- [ ] All environment variables set in production
- [ ] Redirect URIs updated to production domain
- [ ] Platform apps moved out of sandbox/dev mode
- [ ] Rate limiting implemented
- [ ] Error logging configured
- [ ] Monitoring alerts set up
- [ ] Security review completed
- [ ] Load testing performed

## Troubleshooting Resources

- [Twitter OAuth Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Facebook OAuth Documentation](https://developers.facebook.com/docs/facebook-login)
- [LinkedIn OAuth Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Reddit OAuth Documentation](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [Pinterest OAuth Documentation](https://developers.pinterest.com/docs/api/v5/)
- [TikTok OAuth Documentation](https://developers.tiktok.com/doc/oauth-user-access-token-management)

## Support

If you encounter issues not covered in this guide:

1. Check Supabase Edge Function logs
2. Review browser console for errors
3. Verify platform developer console settings
4. Test with the debug dashboard
5. Check platform-specific API status pages

## Next Steps

After successful OAuth testing:

1. **Implement Posting**: Add actual content posting to connected platforms
2. **Add Analytics**: Fetch engagement metrics from platforms
3. **Setup Webhooks**: Receive real-time updates from platforms
4. **Implement Scheduling**: Add scheduled posting functionality
5. **Add Multi-Account**: Support multiple accounts per platform