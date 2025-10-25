# OAuth Testing & Debugging Guide

This guide will help you test and debug the OAuth integration for all social media platforms in PubHub.

## Quick Access

The OAuth Testing interface is located in:
**Project Settings → OAuth Test**

## Features

### 1. Real-Time OAuth Flow Testing
Test the complete OAuth flow for each platform with detailed step-by-step logging:
- Authorization URL generation
- State management (CSRF protection)
- Code exchange for access tokens
- User profile retrieval
- Connection storage

### 2. Environment Variables Checker
Automatically verifies if OAuth credentials are configured for each platform:
- ✅ **Configured**: Platform has CLIENT_ID and CLIENT_SECRET
- ❌ **Missing**: Required environment variables are not set

### 3. Detailed Logging System
Every OAuth action is logged with:
- **Timestamp**: When the action occurred
- **Type**: Info, Success, Error, or Warning
- **Message**: Human-readable description
- **Details**: JSON data for debugging

### 4. Connection Management
- View current connection status for each platform
- Test reconnection flows
- Test disconnect flows
- View connected account information

## Testing Each Platform

### Testing Process

For each platform, follow these steps:

1. **Navigate to OAuth Test tab**
   - Go to Project Settings
   - Click on the "OAuth Test" tab

2. **Select a Platform**
   - Choose the platform you want to test from the tabs

3. **Check Environment Variables**
   - Look for the "Environment Variables" status
   - If "Missing", add the required credentials to Supabase environment variables

4. **Start OAuth Flow**
   - Click "Test OAuth Flow" button
   - You'll be redirected to the platform's authorization page
   - Authorize PubHub to access your account
   - You'll be redirected back to PubHub
   - The connection status will update automatically

5. **Review Logs**
   - Check the "Test Logs" section for detailed information
   - Copy logs for troubleshooting if needed

6. **Test Disconnect** (optional)
   - Click "Disconnect" to test the disconnect flow
   - Verify the connection is removed
   - Check logs for any errors

## Platform-Specific Setup

### Twitter/X
**Required Environment Variables:**
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `TWITTER_REDIRECT_URI`

**Scopes:** `tweet.read tweet.write users.read offline.access`

**Notes:**
- Requires OAuth 2.0 with PKCE
- Redirect URI must match exactly

### Instagram
**Required Environment Variables:**
- `INSTAGRAM_CLIENT_ID`
- `INSTAGRAM_CLIENT_SECRET`
- `INSTAGRAM_REDIRECT_URI`

**Scopes:** `user_profile,user_media`

**Notes:**
- Uses Facebook's OAuth system
- Requires approved app in Facebook Developer Console

### LinkedIn
**Required Environment Variables:**
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI`

**Scopes:** `w_member_social r_liteprofile`

**Notes:**
- Requires LinkedIn app with proper permissions
- Limited posting capabilities based on app approval

### Facebook
**Required Environment Variables:**
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_REDIRECT_URI`

**Scopes:** `pages_manage_posts,pages_read_engagement`

**Notes:**
- Requires Facebook App
- Page access tokens needed for posting

### YouTube
**Required Environment Variables:**
- `YOUTUBE_CLIENT_ID` (or `GOOGLE_CLIENT_ID`)
- `YOUTUBE_CLIENT_SECRET` (or `GOOGLE_CLIENT_SECRET`)
- `YOUTUBE_REDIRECT_URI` (or `OAUTH_REDIRECT_URL`)

**Scopes:** `https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube`

**Notes:**
- Uses Google OAuth 2.0
- Requires Google Cloud Console project
- API quotas apply

### TikTok
**Required Environment Variables:**
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_REDIRECT_URI`

**Scopes:** `user.info.basic,video.upload`

**Notes:**
- Requires TikTok Developer account
- App must be approved for production

### Pinterest
**Required Environment Variables:**
- `PINTEREST_APP_ID`
- `PINTEREST_APP_SECRET`
- `PINTEREST_REDIRECT_URI`

**Scopes:** `boards:read,pins:read,pins:write`

**Notes:**
- Requires Pinterest Developer account
- API v5 used

### Reddit
**Required Environment Variables:**
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_REDIRECT_URI`

**Scopes:** `submit,identity`

**Notes:**
- Uses Basic Auth for token exchange
- Requires User-Agent header

## Common Issues & Solutions

### Issue: "Environment variables not configured"
**Solution:**
1. Go to Supabase Dashboard
2. Navigate to Project Settings → Edge Functions
3. Add the required environment variables for the platform
4. Redeploy the edge function

### Issue: "Invalid redirect URI"
**Solution:**
1. Check that `FRONTEND_URL` is set correctly in environment variables
2. Verify the redirect URI in platform's developer console matches exactly
3. Ensure it's using HTTPS in production

### Issue: "State mismatch" or "Invalid state"
**Solution:**
1. Clear browser sessionStorage
2. Try the OAuth flow again
3. Check if cookies are enabled
4. Verify backend state storage is working

### Issue: "Token exchange failed"
**Solution:**
1. Verify CLIENT_ID and CLIENT_SECRET are correct
2. Check platform's API status
3. Review backend logs for detailed error
4. Ensure redirect_uri matches exactly

### Issue: "Failed to fetch user info"
**Solution:**
- This is often a warning, not a critical error
- Connection may still work for posting
- Check platform's API permissions
- Some platforms require additional scopes

## Debugging Tips

### 1. Use the Logs
- All OAuth steps are logged
- Copy logs and search for errors
- Check timestamps to identify slow steps

### 2. Browser Developer Tools
- Open Network tab to see API calls
- Check for failed requests
- Inspect redirect URLs

### 3. Backend Logs
- Check Supabase Edge Function logs
- Look for detailed error messages
- Verify token exchange responses

### 4. Platform Developer Consoles
- Review app settings
- Check OAuth callback URLs
- Verify app permissions and scopes
- Look for usage limits or errors

### 5. Test in Incognito Mode
- Eliminates cookie/cache issues
- Clean slate for OAuth flow
- Helps identify session problems

## Testing Checklist

Use this checklist to ensure each platform is properly tested:

- [ ] Environment variables are set
- [ ] Authorization URL is generated
- [ ] Redirect to platform works
- [ ] Authorization is granted
- [ ] Callback is received
- [ ] Code is exchanged for token
- [ ] User info is retrieved
- [ ] Connection is stored
- [ ] Connection shows as "Connected"
- [ ] Disconnect works properly
- [ ] Reconnect works properly
- [ ] No errors in logs

## Advanced Testing

### Testing Token Refresh
Some platforms provide refresh tokens. To test:
1. Wait for access token to expire (varies by platform)
2. Try making an API call
3. Backend should automatically refresh token
4. Check logs for refresh token usage

### Testing Multiple Accounts
1. Connect first account
2. Disconnect
3. Connect second account
4. Verify correct account is connected

### Testing Edge Cases
- Cancel authorization flow
- Deny permissions
- Use expired authorization code
- Test with revoked app access
- Test rate limiting

## Need Help?

If you're still experiencing issues:

1. **Copy all logs** using the "Copy All Logs" button
2. **Check platform documentation** links in OAuth Test interface
3. **Review backend logs** in Supabase Dashboard
4. **Verify environment variables** are set correctly
5. **Test with a different browser** to rule out local issues

## OAuth Flow Diagram

```
User clicks "Connect Platform"
         ↓
Backend generates authorization URL with state
         ↓
User is redirected to platform
         ↓
User authorizes PubHub
         ↓
Platform redirects to callback with code
         ↓
Frontend sends code to backend
         ↓
Backend exchanges code for access token
         ↓
Backend fetches user info
         ↓
Backend stores token and updates connection
         ↓
User sees "Connected" status
```

## Security Notes

- State parameter prevents CSRF attacks
- Tokens are stored securely in backend KV store
- Access tokens never exposed to frontend
- Refresh tokens used when available
- OAuth flow uses HTTPS only

---

**Last Updated:** October 2024
**Version:** 1.0
