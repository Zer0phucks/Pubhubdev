# OAuth Provider Configuration Guide

## Current Status
- ✅ **Google OAuth**: Configured and ready
- ⏳ **Facebook OAuth**: Waiting for verification
- ⏳ **Twitter OAuth**: Waiting for verification

## Required Supabase Auth Dashboard Configuration

### Step 1: Access Supabase Auth Dashboard
Go to: https://supabase.com/dashboard/project/ykzckfwdvmzuzxhezthv/auth/providers

### Step 2: Configure Google OAuth (Ready)
1. **Enable Google provider**: Toggle ON
2. **Client ID**: Already configured in secrets
3. **Client Secret**: Already configured in secrets
4. **Redirect URL**: `https://ykzckfwdvmzuzxhezthv.supabase.co/auth/v1/callback`

### Step 3: Configure Facebook OAuth (Pending)
1. **Enable Facebook provider**: Toggle ON
2. **Client ID**: Add Facebook App ID to secrets
3. **Client Secret**: Add Facebook App Secret to secrets
4. **Redirect URL**: `https://ykzckfwdvmzuzxhezthv.supabase.co/auth/v1/callback`

### Step 4: Configure Twitter OAuth (Pending)
1. **Enable Twitter provider**: Toggle ON
2. **Client ID**: Add Twitter Client ID to secrets
3. **Client Secret**: Add Twitter Client Secret to secrets
4. **Redirect URL**: `https://ykzckfwdvmzuzxhezthv.supabase.co/auth/v1/callback`

## OAuth Provider Console Configuration

### Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs**:
   ```
   https://ykzckfwdvmzuzxhezthv.supabase.co/auth/v1/callback
   http://localhost:5173/oauth/callback
   https://your-production-domain.com/oauth/callback
   ```

### Facebook Developer Console
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Facebook Login** → **Settings**
4. Add these **Valid OAuth Redirect URIs**:
   ```
   https://ykzckfwdvmzuzxhezthv.supabase.co/auth/v1/callback
   http://localhost:5173/oauth/callback
   https://your-production-domain.com/oauth/callback
   ```

### Twitter Developer Portal
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Select your app
3. Go to **App Settings** → **Authentication settings**
4. Add these **Callback URLs**:
   ```
   https://ykzckfwdvmzuzxhezthv.supabase.co/auth/v1/callback
   http://localhost:5173/oauth/callback
   https://your-production-domain.com/oauth/callback
   ```

## Adding OAuth Credentials to Supabase Secrets

Once you have the OAuth credentials from the provider consoles, add them to Supabase:

```bash
# Facebook OAuth
supabase secrets set FACEBOOK_APP_ID your_facebook_app_id
supabase secrets set FACEBOOK_APP_SECRET your_facebook_app_secret

# Twitter OAuth
supabase secrets set TWITTER_CLIENT_ID your_twitter_client_id
supabase secrets set TWITTER_CLIENT_SECRET your_twitter_client_secret
```

## Testing OAuth Flows

### Test Google OAuth (Ready Now)
1. Start development server: `npm run dev`
2. Navigate to auth page
3. Click Google OAuth button
4. Complete Google authorization
5. Verify redirect back to app

### Test Facebook OAuth (After Setup)
1. Ensure Facebook App is in "Live" mode
2. Test OAuth flow same as Google
3. Check for any Facebook-specific errors

### Test Twitter OAuth (After Setup)
1. Ensure Twitter App is approved for production
2. Test OAuth flow same as Google
3. Check for any Twitter-specific errors

## Common Issues & Solutions

### "Missing required OAuth parameters"
- **Cause**: Redirect URLs don't match between Supabase and OAuth provider
- **Solution**: Ensure exact URL match in both places

### "App not approved for production"
- **Cause**: OAuth app still in development mode
- **Solution**: Submit app for review or enable production mode

### "Invalid client ID"
- **Cause**: Wrong client ID in Supabase secrets
- **Solution**: Copy exact client ID from OAuth provider console

## Next Steps

1. **Immediate**: Test Google OAuth flow (ready now)
2. **Pending**: Wait for Facebook app verification
3. **Pending**: Wait for Twitter app verification
4. **After verification**: Add Facebook and Twitter credentials to Supabase secrets
5. **Test all providers**: Verify complete OAuth flow for each platform

## Production Deployment

When deploying to production:
1. Update OAuth provider redirect URLs with production domain
2. Ensure all OAuth apps are in "Live" mode
3. Test OAuth flows on production environment
4. Monitor OAuth success rates in Supabase logs
