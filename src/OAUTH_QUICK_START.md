# OAuth Quick Start Guide

## 🚀 Getting Started with OAuth Testing

### Step 1: Access the OAuth Tester
1. Sign in to PubHub
2. Navigate to **Project Settings** (gear icon in sidebar)
3. Click on the **OAuth Test** tab

### Step 2: Check Platform Status
The OAuth Tester shows the status of all 8 social platforms:
- ✅ **Green checkmark** = Connected
- ❌ **Red X** = Environment variables missing
- ⚠️ **Yellow warning** = Credentials configured but not connected
- 🔄 **Spinner** = Currently testing

### Step 3: Test a Platform

#### Option A: Quick Test (Recommended for First Time)
1. Select **Twitter** tab (easiest to set up)
2. Click **"Test OAuth Flow"**
3. Watch the logs for detailed progress
4. Authorize PubHub when redirected
5. You'll return to PubHub with a connected status

#### Option B: Test All Platforms
1. Use the platform tabs to switch between platforms
2. Test each one individually
3. Review logs for any errors
4. Fix issues before moving to next platform

## 🔑 Required Environment Variables

### Quick Setup in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Edge Functions**
4. Add environment variables for each platform:

### Twitter
```
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/twitter
```

### Instagram
```
INSTAGRAM_CLIENT_ID=your_client_id
INSTAGRAM_CLIENT_SECRET=your_client_secret
INSTAGRAM_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/instagram
```

### LinkedIn
```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/linkedin
```

### Facebook
```
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/facebook
```

### YouTube
```
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/youtube
```

### TikTok
```
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/tiktok
```

### Pinterest
```
PINTEREST_APP_ID=your_app_id
PINTEREST_APP_SECRET=your_app_secret
PINTEREST_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/pinterest
```

### Reddit
```
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/reddit
```

## 🐛 Common Issues & Quick Fixes

### Issue: "Environment variables not configured"
**Fix:** Add the required credentials to Supabase environment variables and redeploy

### Issue: "Invalid redirect URI"
**Fix:** 
1. Update `FRONTEND_URL` to match your domain
2. Ensure redirect URIs in platform developer consoles match exactly
3. Use HTTPS in production

### Issue: "Authorization failed"
**Fix:**
1. Check credentials are correct
2. Verify app is approved on platform's developer console
3. Check required scopes/permissions are enabled

### Issue: Logs show "Failed to fetch user info"
**Fix:** This is usually a warning, not critical. Connection may still work for posting.

## 📊 Understanding the Logs

### Log Types
- 🔵 **INFO** (Blue): Normal process steps
- ✅ **SUCCESS** (Green): Step completed successfully
- ⚠️ **WARNING** (Yellow): Non-critical issue
- ❌ **ERROR** (Red): Critical failure - OAuth flow stopped

### Typical Successful Flow
```
INFO: Starting OAuth flow test...
INFO: Checking environment variables...
SUCCESS: User authenticated
INFO: Requesting authorization URL...
SUCCESS: Authorization URL generated
INFO: Storing OAuth state...
SUCCESS: OAuth state stored
INFO: Redirecting to [Platform] authorization page...
```

After authorization and redirect back:
```
INFO: Processing OAuth callback...
SUCCESS: Code exchanged for token
SUCCESS: User info retrieved
SUCCESS: Connection stored
SUCCESS: [Platform] connected successfully
```

## 🎯 Testing Checklist

Before considering a platform "fully tested":

- [ ] Environment variables are configured
- [ ] Authorization URL generates without errors
- [ ] Redirect to platform works
- [ ] Can authorize on platform
- [ ] Callback is received
- [ ] Token exchange succeeds
- [ ] User info is retrieved
- [ ] Connection shows as "Connected"
- [ ] Can disconnect successfully
- [ ] Can reconnect successfully
- [ ] No errors in logs

## 💡 Pro Tips

### 1. Test in Order
Start with easier platforms:
1. Twitter (OAuth 2.0, straightforward)
2. LinkedIn (similar to Twitter)
3. Reddit (simpler than most)
4. Facebook (more complex)
5. Instagram (requires Facebook setup)
6. YouTube (requires Google Cloud setup)
7. Pinterest (requires app approval)
8. TikTok (requires app approval)

### 2. Use Copy Logs Feature
- Click "Copy" button to save logs
- Paste in troubleshooting docs
- Share with support if needed

### 3. Clear Logs Between Tests
- Use "Clear" to remove old logs
- Easier to see current test results
- Less scrolling

### 4. Test in Incognito
- Clean slate for each test
- Eliminates cookie issues
- Better for troubleshooting

### 5. Keep Developer Consoles Open
- Have platform's dev console open in another tab
- Check for errors on their side
- Verify settings match

## 🔗 Quick Links

### Platform Developer Consoles
- [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- [Facebook Developers](https://developers.facebook.com/)
- [LinkedIn Developers](https://www.linkedin.com/developers/)
- [Google Cloud Console](https://console.cloud.google.com/) (for YouTube)
- [TikTok Developers](https://developers.tiktok.com/)
- [Pinterest Developers](https://developers.pinterest.com/)
- [Reddit Apps](https://www.reddit.com/prefs/apps)

### OAuth Documentation
See `OAUTH_SETUP.md` and `OAUTH_IMPLEMENTATION.md` for detailed documentation.

## 🆘 Still Having Issues?

1. **Check the detailed guide**: See `OAUTH_TESTING_GUIDE.md`
2. **Review backend logs**: Check Supabase Edge Function logs
3. **Verify credentials**: Double-check all environment variables
4. **Test different browser**: Rule out browser-specific issues
5. **Check platform status**: Verify the platform's API is operational

## 📝 Notes

- OAuth tokens are stored securely in the backend
- Access tokens are never exposed to the frontend
- Refresh tokens are automatically used when available
- All OAuth operations are logged for debugging
- Multiple projects can connect different accounts

---

**Need more help?** Check the full documentation in `OAUTH_TESTING_GUIDE.md`
