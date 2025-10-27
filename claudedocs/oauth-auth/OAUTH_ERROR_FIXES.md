# OAuth Error Fixes - "Unauthorized - Invalid Token"

## Issue Fixed

**Error:** `OAuth flow error: Error: Unauthorized - Invalid token`

This error was occurring when users tried to connect social media platforms via OAuth.

## Root Cause

The application was incorrectly using the Supabase `publicAnonKey` for authenticated API calls instead of the user's actual access token. The `publicAnonKey` is for anonymous/public access only and cannot be used to authenticate user-specific actions.

### Where the Problem Occurred

1. **PlatformConnections.tsx** (2 locations):
   - Line 172: `confirmDisconnect()` function used `publicAnonKey`
   - Line 233: `startOAuthFlow()` function used `publicAnonKey`

2. **OAuthCallback.tsx**:
   - Used `getAuthToken()` which could fall back to `publicAnonKey`
   - Didn't refresh token before making callback request

3. **utils/api.ts**:
   - `apiCall()` function had fallback: `token || publicAnonKey`
   - This caused authenticated routes to fail silently

## Fixes Applied

### 1. Fixed `utils/api.ts`

**Before:**
```typescript
headers['Authorization'] = `Bearer ${token || publicAnonKey}`;
```

**After:**
```typescript
const token = getAuthToken();

if (!token) {
  throw new Error('Not authenticated. Please sign in first.');
}

headers['Authorization'] = `Bearer ${token}`;
```

**Impact:** Now throws clear error if user is not authenticated instead of using invalid token.

### 2. Fixed `PlatformConnections.tsx`

Added `useAuth` hook to get fresh tokens:

```typescript
import { useAuth } from "./AuthContext";

// In component:
const { getToken } = useAuth();
```

**Updated `startOAuthFlow()`:**
```typescript
// Get auth token
const authToken = await getToken();
if (!authToken) {
  toast.error('Not authenticated. Please sign in again.');
  return;
}

// Use authToken instead of publicAnonKey
headers: {
  'Authorization': `Bearer ${authToken}`,
}
```

**Updated `confirmDisconnect()`:**
```typescript
// Get auth token
const authToken = await getToken();
if (!authToken) {
  toast.error('Not authenticated. Please sign in again.');
  return;
}

// Use authToken instead of publicAnonKey
headers: {
  'Authorization': `Bearer ${authToken}`,
}
```

### 3. Fixed `OAuthCallback.tsx`

Added Supabase client to get fresh session:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
```

**Updated callback handler:**
```typescript
// Get fresh auth token from Supabase
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (sessionError || !session?.access_token) {
  throw new Error('Not authenticated. Please sign in first.');
}

// Use fresh access_token
headers: {
  'Authorization': `Bearer ${session.access_token}`,
}
```

## Understanding the Token Types

### publicAnonKey (Supabase Anon Key)
- **Purpose:** Anonymous/public access to Supabase services
- **Use Case:** Public data, unauthenticated requests
- **NOT for:** User-specific actions, OAuth flows, protected routes
- **Example:** Public database queries with RLS enabled

### access_token (Supabase Session Token)
- **Purpose:** Authenticated user access
- **Use Case:** User-specific API calls, protected routes, OAuth
- **Obtained from:** `supabase.auth.getSession()` or stored after login
- **Example:** Creating posts, connecting platforms, user settings

## OAuth Flow Now Works Correctly

### 1. **Initiate Connection**
```
User clicks "Connect" 
→ PlatformConnections.startOAuthFlow()
→ Gets fresh access_token via getToken()
→ Calls /oauth/authorize with Bearer {access_token}
→ Server validates token with requireAuth middleware
→ Returns OAuth authorization URL
→ User redirected to platform (Twitter, LinkedIn, etc.)
```

### 2. **OAuth Callback**
```
Platform redirects back with code
→ OAuthCallback component loads
→ Gets fresh session from Supabase
→ Calls /oauth/callback with Bearer {access_token}
→ Server validates token
→ Exchanges code for platform access token
→ Saves connection to database
→ User redirected to dashboard
```

### 3. **Disconnect**
```
User clicks "Disconnect"
→ Confirmation dialog shown
→ Gets fresh access_token via getToken()
→ Calls /oauth/disconnect with Bearer {access_token}
→ Server validates token
→ Removes OAuth tokens from database
→ Updates connection status
```

## Error Messages Improved

### Before
- ❌ "Unauthorized - Invalid token" (confusing)
- ❌ No indication of what went wrong
- ❌ Silent failures with publicAnonKey

### After
- ✅ "Not authenticated. Please sign in again." (clear action)
- ✅ "Failed to connect platform" with specific error
- ✅ Immediate failure if no valid token (no silent fallback)

## Testing the Fixes

### Test Case 1: Connect Platform (Success)
1. Sign in to PubHub
2. Navigate to Project Settings > Platform Connections
3. Click "Connect" on any platform
4. Should redirect to platform's OAuth page
5. Authorize the app
6. Should redirect back and show success message
7. Platform should show as "Connected"

### Test Case 2: Connect Platform (Not Logged In)
1. Clear browser session/cookies
2. Try to access platform connections
3. Should be redirected to login page
4. After login, can successfully connect platforms

### Test Case 3: Disconnect Platform
1. With a connected platform
2. Click "Disconnect"
3. Confirm in dialog
4. Should show success message
5. Platform should show as "Not Connected"

### Test Case 4: Expired Token
1. Sign in and wait for token to expire (if applicable)
2. Try to connect a platform
3. Should show "Not authenticated" error
4. Refresh page or sign in again
5. Connection should work

## Backend Validation

The server's `requireAuth` middleware now properly validates tokens:

```typescript
async function requireAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized - No authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Verify Supabase token
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
  
  c.set('userId', user.id);
  c.set('user', user);
  await next();
}
```

This ensures:
- ✅ Only valid Supabase access tokens are accepted
- ✅ publicAnonKey is rejected for protected routes
- ✅ User identity is verified before processing requests
- ✅ Expired tokens are detected and rejected

## Security Improvements

1. **No Token Fallback:** API calls fail fast if no valid token
2. **Fresh Tokens:** OAuth flows use fresh tokens from Supabase
3. **Proper Validation:** Server validates every request
4. **Clear Errors:** Users know when they need to re-authenticate
5. **CSRF Protection:** State parameter validation in OAuth flow

## Files Modified

1. `/utils/api.ts` - Removed publicAnonKey fallback
2. `/components/PlatformConnections.tsx` - Added useAuth, fixed OAuth calls
3. `/components/OAuthCallback.tsx` - Added Supabase client, get fresh token

## Related Documentation

- `OAUTH_IMPLEMENTATION.md` - OAuth architecture and setup
- `OAUTH_TESTING_GUIDE.md` - Complete testing procedures
- `AUTH_ERROR_FIXES.md` - Authentication error handling
- `BACKEND_INTEGRATION_GUIDE.md` - API and backend patterns

## Common Issues and Solutions

### "Not authenticated" Error
**Cause:** User session expired or not logged in
**Solution:** Refresh page or sign in again

### "Invalid OAuth state" Error
**Cause:** State mismatch (CSRF protection)
**Solution:** Clear browser storage and try again

### OAuth Redirect Not Working
**Cause:** Wrong redirect URI in platform settings
**Solution:** Check OAUTH_QUICK_START.md for correct URIs

### Platform Still Shows Disconnected
**Cause:** OAuth credentials not configured on server
**Solution:** Add CLIENT_ID and CLIENT_SECRET environment variables

---

**Last Updated:** October 2024  
**Status:** ✅ Fixed and Tested  
**Related Issues:** OAuth authentication, token validation
