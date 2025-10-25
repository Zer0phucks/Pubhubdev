# OAuth Integration Implementation

## Overview

Full OAuth 2.0 integration has been implemented for connecting social media platforms to PubHub. This allows users to securely connect their social accounts and post content directly from the dashboard.

## What Was Implemented

### 1. Backend OAuth Routes (`/supabase/functions/server/index.tsx`)

Four new routes were added to handle the complete OAuth flow:

#### `GET /oauth/authorize/:platform`
- Generates OAuth authorization URL for a platform
- Creates and stores a state parameter for CSRF protection
- Returns the URL for the frontend to redirect to
- Requires: `projectId` query parameter

#### `POST /oauth/callback`
- Handles the OAuth callback from platforms
- Exchanges authorization code for access token
- Fetches user info from the platform
- Stores tokens securely in KV store
- Updates project connections
- Validates state for security

#### `POST /oauth/disconnect`
- Disconnects a platform from a project
- Removes stored OAuth tokens
- Updates project connections

#### `GET /oauth/token/:platform/:projectId`
- Retrieves stored access token for making API calls
- Automatically refreshes expired tokens if refresh token available
- Used internally by platform API functions

### 2. Frontend Components

#### `OAuthCallback.tsx`
- Handles the OAuth callback in the frontend
- Shows loading/success/error states
- Processes the authorization code
- Redirects user back to dashboard after completion

#### Updated `PlatformConnections.tsx`
- Added real OAuth flow integration
- Shows helpful info banner for first-time users
- Properly handles connection/disconnection
- Integrates with backend OAuth routes

### 3. Utility Functions (`/utils/platformAPI.ts`)

Created helper functions for posting to each platform:

- `postToTwitter()` - Post tweets
- `postToLinkedIn()` - Share on LinkedIn
- `postToFacebook()` - Post to Facebook pages
- `postToReddit()` - Submit to subreddits
- `postToPinterest()` - Create pins
- `postToPlatform()` - Generic router function
- `validateConnection()` - Check if connection is valid

Platforms requiring media uploads (Instagram, YouTube, TikTok) have placeholder functions that need additional implementation.

### 4. App Router Update

Added OAuth callback route handling in `App.tsx`:
```typescript
if (window.location.pathname === '/oauth/callback') {
  return <OAuthCallback />;
}
```

## Supported Platforms

✅ **Fully Implemented:**
- Twitter/X
- LinkedIn
- Facebook Pages
- Reddit

⚠️ **Partial Implementation** (OAuth works, posting needs media upload):
- Instagram
- YouTube
- TikTok
- Pinterest

## Security Features

1. **State Parameter**: CSRF protection with randomized state stored server-side
2. **Token Storage**: Access tokens stored in backend KV store, never exposed to frontend
3. **Token Refresh**: Automatic refresh of expired tokens using refresh tokens
4. **Per-Project**: Each social account can only be connected to one project
5. **Validation**: State validation ensures callbacks aren't spoofed
6. **Expiry**: State tokens expire after 10 minutes

## Configuration Required

### Environment Variables

You need to add OAuth credentials for each platform you want to support. See `OAUTH_SETUP.md` for detailed instructions.

Example for Twitter:
```
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
```

### Redirect URIs

All platforms need to have this redirect URI configured in their developer settings:
```
https://your-app.com/oauth/callback
```

Some platforms also support platform-specific redirects:
```
https://your-app.com/oauth/callback?platform=twitter
```

## How to Use

### For Users:

1. Navigate to **Project Settings → Connections**
2. Click **Connect** on any platform
3. You'll be redirected to the platform's authorization page
4. Authorize PubHub to access your account
5. You'll be redirected back and the connection will be active
6. The platform icon will show "Connected" with your username

### For Developers:

#### To post content to a connected platform:

```typescript
import { postToPlatform } from './utils/platformAPI';

// Post to Twitter
await postToPlatform('twitter', projectId, {
  content: 'Hello from PubHub!',
});

// Post to LinkedIn
await postToPlatform('linkedin', projectId, {
  content: 'Professional update from PubHub',
});

// Post to Reddit
await postToPlatform('reddit', projectId, {
  content: 'Check out this cool feature!',
}, {
  subreddit: 'webdev',
});
```

#### To get an access token directly:

```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/oauth/token/twitter/${projectId}`,
  {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` },
  }
);
const { accessToken } = await response.json();
```

## Flow Diagram

```
User clicks "Connect Platform"
  ↓
Frontend: startOAuthFlow()
  ↓
Backend: GET /oauth/authorize/:platform
  ↓
Frontend: Redirect to platform OAuth page
  ↓
User authorizes on platform
  ↓
Platform: Redirect to /oauth/callback?code=...&state=...
  ↓
Frontend: OAuthCallback component
  ↓
Backend: POST /oauth/callback (exchange code for token)
  ↓
Backend: Store token in KV store
  ↓
Backend: Update project connections
  ↓
Frontend: Show success & redirect to dashboard
```

## Error Handling

All OAuth operations include comprehensive error handling:

- Missing credentials → "OAuth not configured" error with helpful message
- Invalid state → "Invalid OAuth state" prevents CSRF attacks
- Token exchange failure → Detailed error from platform
- Duplicate connections → Prevents connecting same account to multiple projects

## Next Steps

To complete the implementation:

1. **Add OAuth Credentials**: Set up developer apps on each platform and add credentials to Supabase environment variables

2. **Test Connections**: Try connecting each platform to verify OAuth flow works

3. **Implement Media Upload**: For Instagram, YouTube, and TikTok, implement the media upload flow:
   - Upload media to platform-specific endpoints
   - Create post/video containers
   - Handle resumable uploads for large files

4. **Add Posting UI**: Integrate `platformAPI.ts` functions into ContentComposer to actually post to connected platforms

5. **Handle Webhooks**: Set up webhook endpoints to receive notifications from platforms (comments, mentions, etc.)

6. **Rate Limiting**: Add rate limiting to prevent hitting platform API limits

## Testing Checklist

- [ ] Twitter connection and posting
- [ ] LinkedIn connection and posting  
- [ ] Facebook connection and posting
- [ ] Reddit connection and posting
- [ ] Token refresh for expired tokens
- [ ] Disconnection removes tokens and updates UI
- [ ] State validation prevents CSRF
- [ ] Error messages are helpful and specific
- [ ] Multiple projects can't share same account
- [ ] OAuth callback handles errors gracefully

## Files Modified/Created

### Created:
- `/supabase/functions/server/index.tsx` - Added OAuth routes
- `/components/OAuthCallback.tsx` - OAuth callback handler
- `/utils/platformAPI.ts` - Platform API utilities
- `/OAUTH_SETUP.md` - Setup documentation
- `/OAUTH_IMPLEMENTATION.md` - This file

### Modified:
- `/components/PlatformConnections.tsx` - Real OAuth integration
- `/App.tsx` - OAuth callback routing

## Resources

- [Twitter OAuth 2.0 Docs](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [LinkedIn OAuth Docs](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Facebook OAuth Docs](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow)
- [Reddit OAuth Docs](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [Instagram API Docs](https://developers.facebook.com/docs/instagram-api)
- [YouTube API Docs](https://developers.google.com/youtube/v3)
- [TikTok API Docs](https://developers.tiktok.com/)
- [Pinterest API Docs](https://developers.pinterest.com/docs/api/v5/)
