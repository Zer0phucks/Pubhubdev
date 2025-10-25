# OAuth Platform Integration Setup

PubHub now supports real OAuth integration with social media platforms! This guide will help you configure each platform.

## Prerequisites

You need to set up developer apps on each platform you want to connect. The credentials you already have will be used as environment variables.

## Environment Variables

Add these environment variables to your Supabase project for each platform you want to support:

### Twitter/X
```
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
```

### Instagram
```
INSTAGRAM_CLIENT_ID=your_client_id
INSTAGRAM_CLIENT_SECRET=your_client_secret
INSTAGRAM_REDIRECT_URI=https://your-app.com/oauth/callback?platform=instagram
```

### LinkedIn
```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=https://your-app.com/oauth/callback?platform=linkedin
```

### Facebook
```
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=https://your-app.com/oauth/callback?platform=facebook
```

### YouTube (uses Google OAuth)
```
YOUTUBE_CLIENT_ID=your_google_client_id
YOUTUBE_CLIENT_SECRET=your_google_client_secret
YOUTUBE_REDIRECT_URI=https://your-app.com/oauth/callback?platform=youtube

# OR use the Google credentials directly:
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_REDIRECT_URL=https://your-app.com/oauth/callback
```

### TikTok
```
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=https://your-app.com/oauth/callback?platform=tiktok
```

### Pinterest
```
PINTEREST_APP_ID=your_app_id
PINTEREST_APP_SECRET=your_app_secret
PINTEREST_REDIRECT_URI=https://your-app.com/oauth/callback?platform=pinterest
```

### Reddit
```
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_REDIRECT_URI=https://your-app.com/oauth/callback?platform=reddit
```

### Frontend URL
```
FRONTEND_URL=https://your-app.com
```

## How It Works

1. **User clicks "Connect" on a platform** in Project Settings → Connections
2. **Backend generates an OAuth authorization URL** with your client ID and redirect URI
3. **User is redirected to the platform** to authorize PubHub
4. **Platform redirects back** to `/oauth/callback` with an authorization code
5. **Backend exchanges the code for an access token** and stores it securely
6. **Connection is marked as active** and user info is displayed

## Platform-Specific Setup

### Twitter/X
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app or use existing one
3. Enable OAuth 2.0
4. Add redirect URI: `https://your-app.com/oauth/callback?platform=twitter`
5. Required scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`

### Instagram
1. Go to https://developers.facebook.com/apps
2. Create a new app with Instagram Basic Display or Instagram Graph API
3. Add OAuth redirect URI
4. Required permissions: `user_profile`, `user_media`

### LinkedIn
1. Go to https://www.linkedin.com/developers/apps
2. Create a new app
3. Add redirect URL under "Auth" tab
4. Request access to: `w_member_social`, `r_liteprofile`

### Facebook Pages
1. Go to https://developers.facebook.com/apps
2. Add "Facebook Login" product
3. Configure OAuth redirect URIs
4. Required permissions: `pages_manage_posts`, `pages_read_engagement`

### YouTube
1. Go to https://console.cloud.google.com/
2. Create a new project or use existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI
6. Required scopes: YouTube upload and manage

### TikTok
1. Go to https://developers.tiktok.com/
2. Create a new app
3. Add redirect URI in app settings
4. Request permissions: `user.info.basic`, `video.upload`

### Pinterest
1. Go to https://developers.pinterest.com/apps/
2. Create a new app
3. Add redirect URI
4. Required scopes: `boards:read`, `pins:read`, `pins:write`

### Reddit
1. Go to https://www.reddit.com/prefs/apps
2. Create a new app (web app type)
3. Set redirect URI
4. Required scopes: `submit`, `identity`

## Security Features

- **State parameter** for CSRF protection
- **Secure token storage** in backend key-value store
- **Token refresh** handled automatically when tokens expire
- **Per-project connections** - each social account can only connect to one project
- **Access tokens never sent to frontend** - only returned when needed for API calls

## Testing

1. Add at least one set of credentials for a platform
2. Navigate to Project Settings → Connections
3. Click "Connect" on the platform
4. You should be redirected to the platform's OAuth page
5. After authorizing, you'll be redirected back to PubHub
6. The platform should show as "Connected" with your account info

## Troubleshooting

### "OAuth not configured" error
- Make sure you've added the required environment variables for that platform
- Check that the variable names match exactly (case-sensitive)
- Restart your Supabase edge functions after adding variables

### "Invalid redirect URI" error
- Verify the redirect URI in your developer app matches exactly
- Include the `?platform=X` query parameter if required
- Use HTTPS in production

### "Token exchange failed" error
- Check that your client secret is correct
- Verify the app is not in sandbox/development mode (if applicable)
- Check platform-specific requirements (some need app review)

### Connection shows but API calls fail
- Token might have expired - refresh should happen automatically
- Check platform API rate limits
- Verify required permissions were granted during OAuth

## Rate Limits

Each platform has different rate limits. The OAuth tokens are stored securely and reused across requests to minimize token generation.

## Next Steps

After connecting platforms, you can:
- Post content directly to connected platforms from the Content Composer
- Schedule posts to go out automatically
- View analytics from connected accounts
- Manage multiple accounts per platform across different projects
