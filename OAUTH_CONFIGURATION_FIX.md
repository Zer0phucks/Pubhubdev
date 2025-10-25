# OAuth Configuration Fix Guide

The OAuth callback errors you're seeing are likely due to incorrect redirect URL configuration. Here's how to fix them:

## 🔧 **Supabase Auth Dashboard Configuration**

### 1. **Go to Supabase Dashboard**
- Navigate to your project: https://supabase.com/dashboard/project/vcdfzxjlahsajulpxzsn
- Go to **Authentication** → **Providers**

### 2. **Configure Each OAuth Provider**

#### **Google OAuth Configuration**
- **Enable Google provider**: Toggle ON
- **Client ID**: Use your Google OAuth client ID
- **Client Secret**: Use your Google OAuth client secret
- **Redirect URL**: `https://vcdfzxjlahsajulpxzsn.supabase.co/auth/v1/callback`

#### **Facebook OAuth Configuration**
- **Enable Facebook provider**: Toggle ON
- **Client ID**: Use your Facebook App ID
- **Client Secret**: Use your Facebook App Secret
- **Redirect URL**: `https://vcdfzxjlahsajulpxzsn.supabase.co/auth/v1/callback`

#### **Twitter OAuth Configuration**
- **Enable Twitter provider**: Toggle ON
- **Client ID**: Use your Twitter Client ID
- **Client Secret**: Use your Twitter Client Secret
- **Redirect URL**: `https://vcdfzxjlahsajulpxzsn.supabase.co/auth/v1/callback`

## 🔗 **OAuth Provider Console Configuration**

### **Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs**:
   ```
   https://vcdfzxjlahsajulpxzsn.supabase.co/auth/v1/callback
   http://localhost:5173/oauth/callback
   ```

### **Facebook Developer Console**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Facebook Login** → **Settings**
4. Add these **Valid OAuth Redirect URIs**:
   ```
   https://vcdfzxjlahsajulpxzsn.supabase.co/auth/v1/callback
   http://localhost:5173/oauth/callback
   ```

### **Twitter Developer Portal**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Select your app
3. Go to **App Settings** → **Authentication settings**
4. Add these **Callback URLs**:
   ```
   https://vcdfzxjlahsajulpxzsn.supabase.co/auth/v1/callback
   http://localhost:5173/oauth/callback
   ```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Missing required OAuth parameters"**
**Solution**: 
- Ensure redirect URLs match exactly in both Supabase and OAuth provider consoles
- Check that the OAuth provider is enabled in Supabase Auth Dashboard

### **Issue 2: "Session was issued in the future"**
**Solution**: 
- This is usually a device clock issue
- Check your system time is correct
- The error is often harmless and can be ignored

### **Issue 3: OAuth provider not working**
**Solution**:
- Verify client ID and secret are correct
- Check that the OAuth app is in "Live" mode (not development)
- Ensure redirect URLs are exactly matching

## 🔍 **Testing Steps**

1. **Clear browser cache** and cookies
2. **Test each provider individually**:
   - Click Google button → should redirect to Google
   - Click Facebook button → should redirect to Facebook  
   - Click Twitter button → should redirect to Twitter
3. **Complete OAuth flow** on each provider
4. **Verify redirect** back to your app

## 📝 **Debug Information**

If you're still having issues, check:

1. **Browser Console**: Look for specific error messages
2. **Network Tab**: Check if OAuth requests are being made
3. **Supabase Logs**: Go to Logs → Auth to see authentication events
4. **OAuth Provider Logs**: Check your OAuth provider's logs for errors

## 🎯 **Expected Flow**

1. User clicks OAuth button
2. Redirects to provider (Google/Facebook/Twitter)
3. User authorizes your app
4. Provider redirects to: `https://vcdfzxjlahsajulpxzsn.supabase.co/auth/v1/callback`
5. Supabase processes the callback
6. Supabase redirects to: `http://localhost:5173/oauth/callback` (or your production URL)
7. Your app handles the final callback and signs in the user

## ⚡ **Quick Fix Commands**

If you need to update the redirect URLs in your OAuth providers, use these exact URLs:

**For Development:**
```
http://localhost:5173/oauth/callback
```

**For Production:**
```
https://your-domain.com/oauth/callback
```

**Supabase Callback (always the same):**
```
https://vcdfzxjlahsajulpxzsn.supabase.co/auth/v1/callback
```

The key is that Supabase handles the OAuth flow and then redirects to your app's callback URL.
