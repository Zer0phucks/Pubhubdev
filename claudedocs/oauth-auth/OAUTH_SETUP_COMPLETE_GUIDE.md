# OAuth Setup Complete Guide

## ✅ What I Found

I found **ALL OAuth credentials** are already in your `.env` file! Here's what you have:

### ✅ Credentials Available

| Platform | Client ID | Client Secret | Redirect URI | Status |
|----------|-----------|---------------|--------------|--------|
| **Twitter/X** | UFJHd1A5djg3Q0pxMUhodllmcnE6MTpjaQ | aS_PTcyS0FGBnvmJqISYOcdkzrnCvcbFlAkEsp8XV14YSnUntZ | https://pubhub.dev/api/oauth/callback/twitter | ✅ Ready |
| **Instagram** | 607674182388054 | 3f0b4725900637b532e21bc09e6d4a3d | https://pubhub.dev/api/oauth/callback/instagram | ✅ Ready |
| **Facebook** | 607674182388054 | 3f0b4725900637b532e21bc09e6d4a3d | https://pubhub.dev/api/oauth/callback/facebook | ✅ Ready |
| **LinkedIn** | 86w0sagddzgpqt | WPL_AP1.72u6v5oSJAn28PWU.JNzjfw== | https://pubhub.dev/api/oauth/callback/linkedin | ✅ Ready |
| **YouTube** | 401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com | 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 | https://pubhub.dev/api/oauth/callback/youtube | ✅ Ready |
| **TikTok** | aw5x5i0z1lp91c8k | zB6MFsrLUPLAlIVnDvZYIA0EfzwsX2wn | https://pubhub.dev/api/oauth/callback/tiktok | ✅ Ready |
| **Pinterest** | 1534363 | pina_AMAZW2IXABEYAAIAGDAKCCS2LYEADGQBQBIQC6HIOZB7L4RLCKOI7XTUR4ITLLMYGH22BQCNNVP2QH4JUJKPUL5BKNB45HQA | https://pubhub.dev/api/oauth/callback/pinterest | ✅ Ready |
| **Reddit** | 1253F-aBlKGyP4xtIFqJ7A | dWGcouy8RwBSL07mC7FYfv0xQJdoIg | https://pubhub.dev/api/oauth/callback/reddit | ✅ Ready |

## ⚠️ Issue Identified

**Problem**: The credentials are in `.env` but need to be pushed to **Supabase Edge Functions secrets** for the backend to use them.

**Why**: The OAuth handler in your Edge Function looks for these as environment variables/secrets in Supabase, not in the local `.env` file.

## 🔧 How to Fix

### Option 1: Install Supabase CLI and Run Script (Recommended)

1. **Install Supabase CLI**:
   ```powershell
   # On Windows
   scoop install supabase
   # OR
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref ykzckfwdvmzuzxhezthv
   ```

4. **Run the setup script**:
   ```bash
   bash setup-oauth-now.sh
   ```

5. **Deploy Edge Functions**:
   ```bash
   cd supabase/functions
   supabase functions deploy make-server-19ccd85e
   ```

### Option 2: Manual Setup via Supabase Dashboard

Go to: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/settings/secrets

Manually add each secret:

```bash
# Frontend Configuration
FRONTEND_URL=https://pubhub.dev
OAUTH_REDIRECT_URL=https://pubhub.dev/api/oauth/callback

# Twitter
TWITTER_CLIENT_ID=UFJHd1A5djg3Q0pxMUhodllmcnE6MTpjaQ
TWITTER_CLIENT_SECRET=aS_PTcyS0FGBnvmJqISYOcdkzrnCvcbFlAkEsp8XV14YSnUntZ
TWITTER_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/twitter

# Instagram
INSTAGRAM_CLIENT_ID=607674182388054
INSTAGRAM_CLIENT_SECRET=3f0b4725900637b532e21bc09e6d4a3d
INSTAGRAM_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/instagram

# Facebook
FACEBOOK_APP_ID=607674182388054
FACEBOOK_APP_SECRET=3f0b4725900637b532e21bc09e6d4a3d
FACEBOOK_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/facebook

# LinkedIn
LINKEDIN_CLIENT_ID=86w0sagddzgpqt
LINKEDIN_CLIENT_SECRET=WPL_AP1.72u6v5oSJAn28PWU.JNzjfw==
LINKEDIN_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/linkedin

# YouTube
YOUTUBE_CLIENT_ID=401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=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
YOUTUBE_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/youtube

# Google (same as YouTube)
GOOGLE_CLIENT_ID=401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# TikTok
TIKTOK_CLIENT_KEY=aw5x5i0z1lp91c8k
TIKTOK_CLIENT_SECRET=zB6MFsrLUPLAlIVnDvZYIA0EfzwsX2wn
TIKTOK_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/tiktok

# Pinterest
PINTEREST_APP_ID=1534363
PINTEREST_APP_SECRET=pina_AMAZW2IXABEYAAIAGDAKCCS2LYEADGQBQBIQC6HIOZB7L4RLCKOI7XTUR4ITLLMYGH22BQCNNVP2QH4JUJKPUL5BKNB45HQA
PINTEREST_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/pinterest

# Reddit
REDDIT_CLIENT_ID=1253F-aBlKGyP4xtIFqJ7A
REDDIT_CLIENT_SECRET=dWGcouy8RwBSL07mC7FYfv0xQJdoIg
REDDIT_REDIRECT_URI=https://pubhub.dev/api/oauth/callback/reddit
```

## 📝 Next Steps After Pushing Secrets

1. **Redeploy Edge Functions**:
   ```bash
   supabase functions deploy make-server-19ccd85e
   ```

2. **Test OAuth Endpoints**:
   Test that each platform can start OAuth flow by calling the authorize endpoint.

3. **Register Callback URLs** in each platform's developer dashboard:
   - **Twitter**: https://developer.twitter.com/en/portal/dashboard → Add: `https://pubhub.dev/api/oauth/callback/twitter`
   - **Facebook/Instagram**: https://developers.facebook.com/apps → Settings → Add redirect URI
   - **LinkedIn**: https://www.linkedin.com/developers → Add callback URL
   - **Google/YouTube**: https://console.cloud.google.com/apis/credentials → Add authorized redirect URI
   - **TikTok**: https://developers.tiktok.com/ → Add callback URL
   - **Pinterest**: https://developers.pinterest.com/ → Add redirect URI
   - **Reddit**: https://www.reddit.com/prefs/apps → Add redirect URI

## 🎯 Summary

**Good News**: ✅ ALL credentials are already in `.env` file!

**Action Needed**: Push these to Supabase Edge Function secrets (2 ways to do this above)

**Time to Complete**: ~15 minutes

**Result**: All OAuth platform connections will work!

