# Manual Supabase OAuth Setup Guide

## ✅ All Credentials Ready in .env File!

I found **ALL 8 platform OAuth credentials** are already in your `.env` file. Now you just need to push them to Supabase Edge Functions.

## 🎯 Quick Setup (5 minutes)

### Step 1: Go to Supabase Dashboard

Open this URL in your browser:
**https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/settings/secrets**

### Step 2: Add Each Secret

Click "Add new secret" and add these secrets one by one:

#### Frontend Configuration (2 secrets)
```
Secret Name: FRONTEND_URL
Value: https://pubhub.dev

Secret Name: OAUTH_REDIRECT_URL
Value: https://pubhub.dev/api/oauth/callback
```

#### Twitter (3 secrets)
```
Secret Name: TWITTER_CLIENT_ID
Value: UFJHd1A5djg3Q0pxMUhodllmcnE6MTpjaQ

Secret Name: TWITTER_CLIENT_SECRET
Value: aS_PTcyS0FGBnvmJqISYOcdkzrnCvcbFlAkEsp8XV14YSnUntZ

Secret Name: TWITTER_REDIRECT_URI
Value: https://pubhub.dev/api/oauth/callback/twitter
```

#### Instagram (3 secrets)
```
Secret Name: INSTAGRAM_CLIENT_ID
Value: 607674182388054

Secret Name: INSTAGRAM_CLIENT_SECRET
Value: 3f0b4725900637b532e21bc09e6d4a3d

Secret Name: INSTAGRAM_REDIRECT_URI
Value: https://pubhub.dev/api/oauth/callback/instagram
```

#### Facebook (3 secrets)
```
Secret Name: FACEBOOK_APP_ID
Value: 607674182388054

Secret Name: FACEBOOK_APP_SECRET
Value: 3f0b4725900637b532e21bc09e6d4a3d

Secret Name: FACEBOOK_REDIRECT_URI
Value: https://pubhub.dev/api/oauth/callback/facebook
```

#### LinkedIn (3 secrets)
```
Secret Name: LINKEDIN_CLIENT_ID
Value: 86w0sagddzgpqt

Secret Name: LINKEDIN_CLIENT_SECRET
Value: WPL_AP1.72u6v5oSJAn28PWU.JNzjfw==

Secret Name: LINKEDIN_REDIRECT_URI
Value: https://pubhub.dev/api/oauth/callback/linkedin
```

#### YouTube (5 secrets - including Google)
```
Secret Name: YOUTUBE_CLIENT_ID
Value: 401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com

Secret Name: YOUTUBE_CLIENT_SECRET
Value: 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

Secret Name: YOUTUBE_REDIRECT_URI
Value: https://pubhub.dev/api/oauth/callback/youtube

Secret Name: GOOGLE_CLIENT_ID
Value: 401065637205-5h92cj4vijli31vqlloi7adnfscrg9ku.apps.googleusercontent.com

Secret Name: GOOGLE_CLIENT_SECRET
Value: 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
```

#### TikTok (3 secrets)
```
Secret Name: TIKTOK_CLIENT_KEY
Value: aw5x5i0z1lp91c8k

Secret Name: TIKTOK_CLIENT_SECRET
Value: zB6MFsrLUPLAlIVnDvZYIA0EfzwsX2wn

Secret Name: TIKTOK_REDIRECT_URI
Value: https://pubhub.dev/api/oauth/callback/tiktok
```

#### Pinterest (3 secrets)
```
Secret Name: PINTEREST_APP_ID
Value: 1534363

Secret Name: PINTEREST_APP_SECRET
Value: pina_AMAZW2IXABEYAAIAGDAKCCS2LYEADGQBQBIQC6HIOZB7L4RLCKOI7XTUR4ITLLMYGH22BQCNNVP2QH4JUJKPUL5BKNB45HQA

Secret Name: PINTEREST_REDIRECT_URI
Value: https://pubhub.dev/api/oauth/callback/pinterest
```

#### Reddit (3 secrets)
```
Secret Name: REDDIT_CLIENT_ID
Value: 1253F-aBlKGyP4xtIFqJ7A

Secret Name: REDDIT_CLIENT_SECRET
Value: dWGcouy8RwBSL07mC7FYfv0xQJdoIg

Secret Name: REDDIT_REDIRECT_URI
Value: https://pubhub.dev/api/oauth/callback/reddit
```

### Step 3: Verify Secrets Are Added

Check that all 26 secrets are listed in the Supabase Dashboard.

### Step 4: Redeploy Edge Functions

After adding all secrets, the Edge Functions will automatically pick them up. If not working, you may need to redeploy.

## 🎉 Done!

Once all secrets are added, your OAuth connections will work! 

## 🧪 Test It

1. Go to https://pubhub.dev
2. Sign in to your app
3. Navigate to Project Settings → Connections
4. Try connecting any platform
5. It should work! 🎉

## 📝 Next: Register Callback URLs

After secrets are added, you'll need to register the callback URLs in each platform's developer console (follow TASKS.md Phase 8 for details).

