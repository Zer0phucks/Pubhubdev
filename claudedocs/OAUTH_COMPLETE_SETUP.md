# 🚀 COMPLETE OAUTH SETUP GUIDE - ALL PLATFORMS READY FOR LAUNCH!

## ⚡ CRITICAL: ALL PLATFORMS MUST BE CONFIGURED BEFORE LAUNCH

This guide will get ALL social media platform integrations working. Follow each step carefully!

## 📋 Platform OAuth Requirements

### 1. Twitter/X OAuth Setup
```bash
# Required Environment Variables:
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Setup Steps:
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new App (or use existing)
3. Enable OAuth 2.0
4. Set Redirect URI: https://your-app.com/oauth/callback?platform=twitter
5. Copy Client ID and Client Secret
```

### 2. Instagram OAuth Setup
```bash
# Required Environment Variables:
INSTAGRAM_CLIENT_ID=your_instagram_app_id
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=https://your-app.com/oauth/callback

# Setup Steps:
1. Go to https://developers.facebook.com/apps
2. Create new App > Consumer > Instagram Basic Display
3. Add Instagram Basic Display product
4. Add OAuth Redirect URI
5. Generate App Secret
```

### 3. LinkedIn OAuth Setup
```bash
# Required Environment Variables:
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://your-app.com/oauth/callback

# Setup Steps:
1. Go to https://www.linkedin.com/developers
2. Create new App
3. Request OAuth 2.0 scopes: r_liteprofile, w_member_social
4. Add Redirect URL
5. Copy Client ID and Secret
```

### 4. Facebook OAuth Setup
```bash
# Required Environment Variables:
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=https://your-app.com/oauth/callback

# Setup Steps:
1. Go to https://developers.facebook.com
2. Create new App > Business
3. Add Facebook Login product
4. Configure OAuth Redirect URIs
5. Add permissions: pages_manage_posts, pages_read_engagement
```

### 5. YouTube OAuth Setup
```bash
# Required Environment Variables:
YOUTUBE_CLIENT_ID=your_google_client_id
YOUTUBE_CLIENT_SECRET=your_google_client_secret
YOUTUBE_REDIRECT_URI=https://your-app.com/oauth/callback

# Setup Steps:
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add redirect URI
6. Download credentials
```

### 6. TikTok OAuth Setup
```bash
# Required Environment Variables:
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=https://your-app.com/oauth/callback

# Setup Steps:
1. Go to https://developers.tiktok.com
2. Create new App
3. Add Login Kit product
4. Configure redirect URI
5. Submit for review (Basic Display permission)
```

### 7. Pinterest OAuth Setup
```bash
# Required Environment Variables:
PINTEREST_APP_ID=your_pinterest_app_id
PINTEREST_APP_SECRET=your_pinterest_app_secret
PINTEREST_REDIRECT_URI=https://your-app.com/oauth/callback

# Setup Steps:
1. Go to https://developers.pinterest.com
2. Create new App
3. Configure OAuth settings
4. Add redirect URI
5. Request necessary scopes
```

### 8. Reddit OAuth Setup
```bash
# Required Environment Variables:
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_REDIRECT_URI=https://your-app.com/oauth/callback

# Setup Steps:
1. Go to https://www.reddit.com/prefs/apps
2. Create new App (script type for testing, web app for production)
3. Set redirect URI
4. Copy Client ID and Secret
```

## 🔧 Supabase Configuration

### Add ALL Environment Variables to Supabase:

```bash
# In your Supabase dashboard > Settings > Edge Functions > Secrets

# Twitter
TWITTER_CLIENT_ID=xxx
TWITTER_CLIENT_SECRET=xxx

# Instagram
INSTAGRAM_CLIENT_ID=xxx
INSTAGRAM_CLIENT_SECRET=xxx
INSTAGRAM_REDIRECT_URI=https://your-app.com/oauth/callback

# LinkedIn
LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx
LINKEDIN_REDIRECT_URI=https://your-app.com/oauth/callback

# Facebook
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
FACEBOOK_REDIRECT_URI=https://your-app.com/oauth/callback

# YouTube/Google
YOUTUBE_CLIENT_ID=xxx
YOUTUBE_CLIENT_SECRET=xxx
YOUTUBE_REDIRECT_URI=https://your-app.com/oauth/callback

# TikTok
TIKTOK_CLIENT_KEY=xxx
TIKTOK_CLIENT_SECRET=xxx
TIKTOK_REDIRECT_URI=https://your-app.com/oauth/callback

# Pinterest
PINTEREST_APP_ID=xxx
PINTEREST_APP_SECRET=xxx
PINTEREST_REDIRECT_URI=https://your-app.com/oauth/callback

# Reddit
REDDIT_CLIENT_ID=xxx
REDDIT_CLIENT_SECRET=xxx
REDDIT_REDIRECT_URI=https://your-app.com/oauth/callback

# Frontend URL (CRITICAL!)
FRONTEND_URL=https://your-app.com
```

## 🚨 QUICK SETUP SCRIPT

Create a file `setup-oauth.sh`:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up OAuth for ALL platforms...${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Supabase CLI not found! Install it first:${NC}"
    echo "npm install -g supabase"
    exit 1
fi

# Function to set secret
set_secret() {
    local key=$1
    local prompt=$2

    echo -e "${GREEN}$prompt${NC}"
    read -s value

    if [ ! -z "$value" ]; then
        supabase secrets set $key=$value
        echo -e "${GREEN}✓ $key set${NC}"
    else
        echo -e "${YELLOW}⚠ $key skipped${NC}"
    fi
}

echo -e "${YELLOW}Enter your OAuth credentials (leave blank to skip):${NC}"

# Twitter
set_secret "TWITTER_CLIENT_ID" "Twitter Client ID:"
set_secret "TWITTER_CLIENT_SECRET" "Twitter Client Secret:"

# Instagram
set_secret "INSTAGRAM_CLIENT_ID" "Instagram Client ID:"
set_secret "INSTAGRAM_CLIENT_SECRET" "Instagram Client Secret:"

# LinkedIn
set_secret "LINKEDIN_CLIENT_ID" "LinkedIn Client ID:"
set_secret "LINKEDIN_CLIENT_SECRET" "LinkedIn Client Secret:"

# Facebook
set_secret "FACEBOOK_APP_ID" "Facebook App ID:"
set_secret "FACEBOOK_APP_SECRET" "Facebook App Secret:"

# YouTube
set_secret "YOUTUBE_CLIENT_ID" "YouTube/Google Client ID:"
set_secret "YOUTUBE_CLIENT_SECRET" "YouTube/Google Client Secret:"

# TikTok
set_secret "TIKTOK_CLIENT_KEY" "TikTok Client Key:"
set_secret "TIKTOK_CLIENT_SECRET" "TikTok Client Secret:"

# Pinterest
set_secret "PINTEREST_APP_ID" "Pinterest App ID:"
set_secret "PINTEREST_APP_SECRET" "Pinterest App Secret:"

# Reddit
set_secret "REDDIT_CLIENT_ID" "Reddit Client ID:"
set_secret "REDDIT_CLIENT_SECRET" "Reddit Client Secret:"

# Frontend URL
echo -e "${GREEN}Enter your frontend URL (e.g., https://your-app.com):${NC}"
read frontend_url
if [ ! -z "$frontend_url" ]; then
    supabase secrets set FRONTEND_URL=$frontend_url
    echo -e "${GREEN}✓ Frontend URL set${NC}"
fi

echo -e "${GREEN}✅ OAuth setup complete!${NC}"
echo -e "${YELLOW}Now deploy your edge functions:${NC}"
echo "supabase functions deploy"
```

## 🔥 EDGE FUNCTION DEPLOYMENT

```bash
# Deploy the edge function with OAuth support
cd /home/noob/credpair/Pubhubdev
supabase functions deploy make-server-19ccd85e
```

## ✅ Testing Each Platform

### Quick Test Script
```javascript
// test-oauth.js
const platforms = ['twitter', 'instagram', 'linkedin', 'facebook', 'youtube', 'tiktok', 'pinterest', 'reddit'];

async function testPlatform(platform) {
  try {
    const response = await fetch(
      `https://YOUR_PROJECT.supabase.co/functions/v1/make-server-19ccd85e/oauth/authorize/${platform}?projectId=test`,
      {
        headers: {
          'Authorization': 'Bearer YOUR_ANON_KEY'
        }
      }
    );

    const data = await response.json();

    if (response.ok && data.authUrl) {
      console.log(`✅ ${platform}: READY`);
    } else {
      console.log(`❌ ${platform}: ${data.error || 'Not configured'}`);
    }
  } catch (error) {
    console.log(`❌ ${platform}: Failed to test`);
  }
}

// Test all platforms
platforms.forEach(testPlatform);
```

## 🎯 CRITICAL CHECKLIST FOR LAUNCH

- [ ] Twitter OAuth configured and tested
- [ ] Instagram OAuth configured and tested
- [ ] LinkedIn OAuth configured and tested
- [ ] Facebook OAuth configured and tested
- [ ] YouTube OAuth configured and tested
- [ ] TikTok OAuth configured and tested
- [ ] Pinterest OAuth configured and tested
- [ ] Reddit OAuth configured and tested
- [ ] Frontend URL environment variable set
- [ ] All redirect URIs match your domain
- [ ] Edge functions deployed successfully
- [ ] Test user can connect all platforms
- [ ] Posting functionality verified for each platform

## 🚨 TROUBLESHOOTING

### Common Issues:

1. **"OAuth not configured" error**
   - Solution: Ensure environment variables are set in Supabase dashboard
   - Check: Variable names match exactly (case-sensitive)

2. **Redirect URI mismatch**
   - Solution: Ensure redirect URI in platform settings matches exactly
   - Format: `https://your-domain.com/oauth/callback`

3. **Invalid client credentials**
   - Solution: Double-check Client ID and Secret from platform dashboard
   - Note: Some platforms regenerate secrets when viewed

4. **Token refresh failing**
   - Solution: Ensure refresh token is stored and valid
   - Check: Token expiry handling in edge function

## 🎉 READY FOR LAUNCH!

Once all platforms show ✅ in testing, you're ready to ship! The OAuth integrations are production-ready and will handle:

- Authorization flow for all platforms
- Token storage and refresh
- Secure credential management
- Multi-project support
- Automatic reconnection on token expiry

**YOU'VE GOT THIS! Ship it! 🚀**