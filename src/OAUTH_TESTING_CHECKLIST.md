# OAuth Testing Checklist

Use this checklist to systematically test and verify OAuth integration for all platforms.

## Pre-Testing Setup

### ✅ Environment Setup
- [ ] Supabase project is created
- [ ] Edge functions are deployed
- [ ] `FRONTEND_URL` is set correctly
- [ ] All platform credentials are added to Supabase environment variables

### ✅ Access OAuth Tester
- [ ] Can navigate to Project Settings → OAuth Test
- [ ] OAuth Tester loads without errors
- [ ] All 8 platform tabs are visible
- [ ] Environment variable status is shown for each platform

---

## Platform Testing

### 🐦 Twitter/X

**Prerequisites:**
- [ ] Twitter Developer account created
- [ ] App created in Twitter Developer Portal
- [ ] OAuth 2.0 enabled
- [ ] Redirect URI added: `https://pubhub.dev/api/oauth/callback/twitter`

**Environment Variables:**
- [ ] `TWITTER_CLIENT_ID` set
- [ ] `TWITTER_CLIENT_SECRET` set
- [ ] `TWITTER_REDIRECT_URI` set

**OAuth Flow Test:**
- [ ] Click "Test OAuth Flow" button
- [ ] Authorization URL is generated (check logs)
- [ ] Redirected to Twitter authorization page
- [ ] Can authorize PubHub app
- [ ] Redirected back to PubHub
- [ ] Connection shows as "Connected"
- [ ] Username is displayed correctly
- [ ] No errors in logs

**Disconnect Test:**
- [ ] Click "Disconnect" button
- [ ] Connection removed successfully
- [ ] Status changes to "Not Connected"
- [ ] No errors in logs

**Reconnect Test:**
- [ ] Can reconnect successfully
- [ ] Previous account data is replaced with new connection

---

### 📷 Instagram

**Prerequisites:**
- [ ] Facebook Developer account created
- [ ] Facebook app created
- [ ] Instagram Basic Display API added to app
- [ ] Test users added (if in development mode)
- [ ] Redirect URI added: `https://pubhub.dev/api/oauth/callback/instagram`

**Environment Variables:**
- [ ] `INSTAGRAM_CLIENT_ID` set
- [ ] `INSTAGRAM_CLIENT_SECRET` set
- [ ] `INSTAGRAM_REDIRECT_URI` set

**OAuth Flow Test:**
- [ ] Click "Test OAuth Flow" button
- [ ] Authorization URL is generated (check logs)
- [ ] Redirected to Instagram authorization page
- [ ] Can authorize PubHub app
- [ ] Redirected back to PubHub
- [ ] Connection shows as "Connected"
- [ ] Username is displayed correctly
- [ ] No errors in logs

**Disconnect Test:**
- [ ] Can disconnect successfully
- [ ] No errors in logs

**Reconnect Test:**
- [ ] Can reconnect successfully

---

### 💼 LinkedIn

**Prerequisites:**
- [ ] LinkedIn Developer account created
- [ ] LinkedIn app created
- [ ] OAuth 2.0 credentials obtained
- [ ] Redirect URI added: `https://pubhub.dev/api/oauth/callback/linkedin`
- [ ] Required scopes enabled: `w_member_social`, `r_liteprofile`

**Environment Variables:**
- [ ] `LINKEDIN_CLIENT_ID` set
- [ ] `LINKEDIN_CLIENT_SECRET` set
- [ ] `LINKEDIN_REDIRECT_URI` set

**OAuth Flow Test:**
- [ ] Click "Test OAuth Flow" button
- [ ] Authorization URL is generated (check logs)
- [ ] Redirected to LinkedIn authorization page
- [ ] Can authorize PubHub app
- [ ] Redirected back to PubHub
- [ ] Connection shows as "Connected"
- [ ] Name is displayed correctly
- [ ] No errors in logs

**Disconnect Test:**
- [ ] Can disconnect successfully
- [ ] No errors in logs

**Reconnect Test:**
- [ ] Can reconnect successfully

---

### 👥 Facebook

**Prerequisites:**
- [ ] Facebook Developer account created
- [ ] Facebook app created
- [ ] Facebook Login product added
- [ ] Pages API access requested (if needed)
- [ ] Redirect URI added: `https://pubhub.dev/api/oauth/callback/facebook`
- [ ] Required permissions: `pages_manage_posts`, `pages_read_engagement`

**Environment Variables:**
- [ ] `FACEBOOK_APP_ID` set
- [ ] `FACEBOOK_APP_SECRET` set
- [ ] `FACEBOOK_REDIRECT_URI` set

**OAuth Flow Test:**
- [ ] Click "Test OAuth Flow" button
- [ ] Authorization URL is generated (check logs)
- [ ] Redirected to Facebook authorization page
- [ ] Can authorize PubHub app
- [ ] Can select a page to manage
- [ ] Redirected back to PubHub
- [ ] Connection shows as "Connected"
- [ ] Name is displayed correctly
- [ ] No errors in logs

**Disconnect Test:**
- [ ] Can disconnect successfully
- [ ] No errors in logs

**Reconnect Test:**
- [ ] Can reconnect successfully

---

### 📺 YouTube

**Prerequisites:**
- [ ] Google Cloud Console account created
- [ ] Project created in Google Cloud Console
- [ ] YouTube Data API v3 enabled
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URI added: `https://pubhub.dev/api/oauth/callback/youtube`
- [ ] Required scopes: `youtube.upload`, `youtube`

**Environment Variables:**
- [ ] `YOUTUBE_CLIENT_ID` or `GOOGLE_CLIENT_ID` set
- [ ] `YOUTUBE_CLIENT_SECRET` or `GOOGLE_CLIENT_SECRET` set
- [ ] `YOUTUBE_REDIRECT_URI` or `OAUTH_REDIRECT_URL` set

**OAuth Flow Test:**
- [ ] Click "Test OAuth Flow" button
- [ ] Authorization URL is generated (check logs)
- [ ] Redirected to Google authorization page
- [ ] Can select YouTube channel
- [ ] Can authorize PubHub app
- [ ] Redirected back to PubHub
- [ ] Connection shows as "Connected"
- [ ] Channel name is displayed correctly
- [ ] No errors in logs

**Disconnect Test:**
- [ ] Can disconnect successfully
- [ ] No errors in logs

**Reconnect Test:**
- [ ] Can reconnect successfully
- [ ] Can select different channel if multiple exist

---

### 🎵 TikTok

**Prerequisites:**
- [ ] TikTok Developer account created
- [ ] TikTok app created
- [ ] Login Kit enabled
- [ ] Redirect URI added: `https://pubhub.dev/api/oauth/callback/tiktok`
- [ ] Required scopes: `user.info.basic`, `video.upload`
- [ ] App approved for production (if not in sandbox)

**Environment Variables:**
- [ ] `TIKTOK_CLIENT_KEY` set
- [ ] `TIKTOK_CLIENT_SECRET` set
- [ ] `TIKTOK_REDIRECT_URI` set

**OAuth Flow Test:**
- [ ] Click "Test OAuth Flow" button
- [ ] Authorization URL is generated (check logs)
- [ ] Redirected to TikTok authorization page
- [ ] Can authorize PubHub app
- [ ] Redirected back to PubHub
- [ ] Connection shows as "Connected"
- [ ] Display name is shown correctly
- [ ] No errors in logs

**Disconnect Test:**
- [ ] Can disconnect successfully
- [ ] No errors in logs

**Reconnect Test:**
- [ ] Can reconnect successfully

---

### 📌 Pinterest

**Prerequisites:**
- [ ] Pinterest Developer account created
- [ ] Pinterest app created
- [ ] OAuth credentials obtained
- [ ] Redirect URI added: `https://pubhub.dev/api/oauth/callback/pinterest`
- [ ] Required scopes: `boards:read`, `pins:read`, `pins:write`

**Environment Variables:**
- [ ] `PINTEREST_APP_ID` set
- [ ] `PINTEREST_APP_SECRET` set
- [ ] `PINTEREST_REDIRECT_URI` set

**OAuth Flow Test:**
- [ ] Click "Test OAuth Flow" button
- [ ] Authorization URL is generated (check logs)
- [ ] Redirected to Pinterest authorization page
- [ ] Can authorize PubHub app
- [ ] Redirected back to PubHub
- [ ] Connection shows as "Connected"
- [ ] Username is displayed correctly
- [ ] No errors in logs

**Disconnect Test:**
- [ ] Can disconnect successfully
- [ ] No errors in logs

**Reconnect Test:**
- [ ] Can reconnect successfully

---

### 🤖 Reddit

**Prerequisites:**
- [ ] Reddit account created
- [ ] Reddit app created at https://www.reddit.com/prefs/apps
- [ ] App type: "web app"
- [ ] Redirect URI added: `https://pubhub.dev/api/oauth/callback/reddit`

**Environment Variables:**
- [ ] `REDDIT_CLIENT_ID` set
- [ ] `REDDIT_CLIENT_SECRET` set
- [ ] `REDDIT_REDIRECT_URI` set

**OAuth Flow Test:**
- [ ] Click "Test OAuth Flow" button
- [ ] Authorization URL is generated (check logs)
- [ ] Redirected to Reddit authorization page
- [ ] Can authorize PubHub app
- [ ] Redirected back to PubHub
- [ ] Connection shows as "Connected"
- [ ] Username is displayed correctly
- [ ] No errors in logs

**Disconnect Test:**
- [ ] Can disconnect successfully
- [ ] No errors in logs

**Reconnect Test:**
- [ ] Can reconnect successfully

---

## Post-Testing Verification

### ✅ Connection Persistence
- [ ] Connections persist after page refresh
- [ ] Connections survive browser restart
- [ ] Connections are project-specific
- [ ] Switching projects shows correct connections

### ✅ Multi-Project Testing
- [ ] Create second project
- [ ] Connect different account to second project
- [ ] Verify first project still has original connection
- [ ] Cannot connect same account to multiple projects (should show error)

### ✅ Error Handling
- [ ] Cancel authorization flow (should handle gracefully)
- [ ] Deny permissions (should show clear error)
- [ ] Use expired code (should show error)
- [ ] Test with invalid credentials (should show config error)

### ✅ Token Management
- [ ] Access tokens are stored in backend
- [ ] Tokens are not visible in frontend
- [ ] Refresh tokens work when available
- [ ] Expired tokens trigger refresh flow

### ✅ UI/UX
- [ ] Connection status updates in real-time
- [ ] Logs are clear and helpful
- [ ] Error messages are user-friendly
- [ ] Success messages are shown
- [ ] Loading states work correctly

### ✅ Security
- [ ] State parameter prevents CSRF
- [ ] Tokens only accessible via backend
- [ ] HTTPS enforced in production
- [ ] Redirect URIs match exactly
- [ ] No sensitive data in logs

---

## Issue Log

Use this section to track any issues found during testing:

### Platform: _______________
**Issue:** 
**Steps to Reproduce:**
**Expected Behavior:**
**Actual Behavior:**
**Logs:**
**Resolution:**
**Status:** [ ] Open [ ] Resolved

---

## Sign-Off

- [ ] All platforms tested successfully
- [ ] All disconnect flows work
- [ ] All reconnect flows work
- [ ] No critical errors in logs
- [ ] Documentation is accurate
- [ ] Ready for production use

**Tested by:** _______________
**Date:** _______________
**Notes:**

---

## Quick Reference

### Testing Priority Order
1. Twitter (easiest)
2. LinkedIn
3. Reddit
4. Facebook
5. Instagram
6. YouTube
7. Pinterest
8. TikTok (hardest - requires approval)

### Common Commands
- **Clear all logs:** "Clear All Logs" button
- **Copy all logs:** "Copy All Logs" button
- **Refresh status:** "Refresh All" button
- **Switch platform:** Click platform tab

### Important Files
- OAuth Tester: `/components/OAuthTester.tsx`
- Backend Routes: `/supabase/functions/server/index.tsx`
- Platform API: `/utils/platformAPI.ts`
- Connection Status: `/components/ConnectionStatus.tsx`

---

**Last Updated:** October 2024
**Version:** 1.0
