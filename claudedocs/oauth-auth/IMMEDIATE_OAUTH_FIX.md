# 🚨 Immediate OAuth Fix - Here's What You Need to Do

## ✅ All Credentials Found!

I found **ALL OAuth credentials** in your `.env` file. You just need to push them to Supabase.

## 📋 Exact Steps (5-10 minutes)

### Step 1: Open Supabase Dashboard

Go to: **https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/settings/secrets**

### Step 2: Add All Secrets

Copy and paste each secret from this list:

#### 🔴 CRITICAL - Add These First (Frontend Config)
1. **Secret Name**: `FRONTEND_URL` | **Value**: `https://pubhub.dev`
2. **Secret Name**: `OAUTH_REDIRECT_URL` | **Value**: `https://pubhub.dev/api/oauth/callback`

#### 📱 Platform Secrets (Add all 24)

**Twitter:**
3. `TWITTER_CLIENT_ID` = `UFJHd1A5djg3Q0pxMUhodllmcnE6MTpjaQ`
4. `TWITTER_CLIENT_SECRET` = `aS_PTcyS0FGBnvmJqISYOcdkzrnCvcbFlAkEsp8XV14YSnUntZ`
5. `TWITTER_REDIRECT_URI` = `https://pubhub.dev/api/oauth/callback/twitter`

**Instagram:**
6. `INSTAGRAM_CLIENT_ID` = `607674182388054`
7. `INSTAGRAM_CLIENT_SECRET` = `3f0b4725900637b532e21bc09e6d4a3d`
8. `INSTAGRAM_REDIRECT_URI` = `https://pubhub.dev/api/oauth/callback/instagram`

**Facebook:**
9. `FACEBOOK_APP_ID` = `607674182388054`
10. `FACEBOOK_APP_SECRET` = `3f0b4725900637b532e21bc09e6d4a3d`
11. `FACEBOOK_REDIRECT_URI` = `https://pubhub.dev/api/oauth/callback/facebook`

**LinkedIn:**
12. `LINKEDIN_CLIENT_ID` = `86w0sagddzgpqt`
13. `LINKEDIN_CLIENT_SECRET` = `WPL_AP1.72u6v5oSJAn28PWU.JNzjfw==`
14. `LINKEDIN_REDIRECT_URI` = `https://pubhub.dev/api/oauth/callback/linkedin`

**YouTube:**
15. `YOUTUBE_CLIENT_ID` = `401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com`
16. `YOUTUBE_CLIENT_SECRET` = `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`
17. `YOUTUBE_REDIRECT_URI` = `https://pubhub.dev/api/oauth/callback/youtube`
18. `GOOGLE_CLIENT_ID` = `401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com` (same as YouTube)
19. `GOOGLE_CLIENT_SECRET` = `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` (same as YouTube)

**TikTok:**
20. `TIKTOK_CLIENT_KEY` = `aw5x5i0z1lp91c8k`
21. `TIKTOK_CLIENT_SECRET` = `zB6MFsrLUPLAlIVnDvZYIA0EfzwsX2wn`
22. `TIKTOK_REDIRECT_URI` = `https://pubhub.dev/api/oauth/callback/tiktok`

**Pinterest:**
23. `PINTEREST_APP_ID` = `1534363`
24. `PINTEREST_APP_SECRET` = `pina_AMAZW2IXABEYAAIAGDAKCCS2LYEADGQBQBIQC6HIOZB7L4RLCKOI7XTUR4ITLLMYGH22BQCNNVP2QH4JUJKPUL5BKNB45HQA`
25. `PINTEREST_REDIRECT_URI` = `https://pubhub.dev/api/oauth/callback/pinterest`

**Reddit:**
26. `REDDIT_CLIENT_ID` = `1253F-aBlKGyP4xtIFqJ7A`
27. `REDDIT_CLIENT_SECRET` = `dWGcouy8RwBSL07mC7FYfv0xQJdoIg`
28. `REDDIT_REDIRECT_URI` = `https://pubhub.dev/api/oauth/callback/reddit`

### Step 3: Verify

Count your secrets - you should have **28 secrets** total (2 frontend + 26 platform)

### Step 4: Test OAuth

1. Go to https://pubhub.dev
2. Sign in
3. Navigate to **Project Settings → Connections**
4. Click "Connect" on any platform
5. It should work! ✅

## 🎯 Why It's Failing Now

The credentials exist in your `.env` file but they're not in Supabase Edge Function secrets. When your Edge Function tries to start OAuth, it can't find the CLIENT_ID, so it returns error "OAuth not configured".

## ✅ After You Add These Secrets

The OAuth flow will work immediately:
1. User clicks "Connect Twitter"
2. Edge Function finds `TWITTER_CLIENT_ID` ✅
3. Returns authorization URL ✅
4. User authorizes on Twitter ✅
5. Redirects back to app ✅
6. Connection established! ✅

## 📝 Quick Test

After adding secrets, test one platform:
1. Go to https://pubhub.dev
2. Try connecting Twitter
3. If it redirects to Twitter login → ✅ Working!
4. If it shows "OAuth not configured" → Need to check secrets again

## ⏱️ Time: 5-10 minutes

Just copy-paste from the list above into Supabase Dashboard. That's it!

