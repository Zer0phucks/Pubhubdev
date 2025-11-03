# Pinterest OAuth Troubleshooting Guide

## Current Status

Pinterest OAuth is configured but failing at the token exchange step with error:
```
{"code":2,"message":"Authentication failed."}
```

## What's Working

✅ Pinterest APP_ID is correct (authorization page loads successfully)
✅ OAuth configuration is correct per Pinterest v5 API docs
✅ Basic Authentication header format is correct
✅ Redirect URI is properly formatted
✅ Authorization flow completes (user can authorize the app)

## What's Failing

❌ Token exchange returns authentication error code 2

## Pinterest Developer Console Checklist

Please verify the following in your Pinterest Developer Console (https://developers.pinterest.com/apps):

### 1. App Credentials
- [ ] Verify **App ID** matches: `1534363`
- [ ] Verify **App secret** in console matches the one in `.env` file
  - Current secret in .env starts with: `pina_AMAZW...`
  - Length: 101 characters
  - If secret was regenerated, update `.env` and Supabase secrets

### 2. Redirect URI Configuration
- [ ] Confirm redirect URI is saved: `https://pubhub.dev/api/oauth/callback/pinterest`
- [ ] Important: Hit ENTER after pasting the URI before clicking Save
- [ ] Verify no trailing slashes or extra characters
- [ ] Protocol must be `https://` (not `http://`)

### 3. App Status
- [ ] App has either **Trial** or **Standard** access (not pending)
- [ ] App is not disabled or suspended
- [ ] Account used to create app is a Pinterest Business Account

### 4. OAuth Scopes
Current requested scopes: `boards:read,pins:read,pins:write`
- [ ] Verify these scopes are enabled for your app
- [ ] Check if additional approval is needed for write scopes

## How to Update Credentials

If you need to regenerate or update the Pinterest APP_SECRET:

1. **Regenerate in Pinterest Console** (if needed)
2. **Update local .env file:**
   ```
   PINTEREST_APP_SECRET=your_new_secret_here
   ```
3. **Update Supabase secrets:**
   ```bash
   npx supabase secrets set PINTEREST_APP_SECRET=your_new_secret_here
   ```
4. **Redeploy the function:**
   ```bash
   npx supabase functions deploy make-server-19ccd85e --no-verify-jwt
   ```

## Technical Details

### Pinterest OAuth v5 Requirements
- **Authentication Method:** Basic Authentication header ONLY
- **Header Format:** `Authorization: Basic {base64(app_id:app_secret)}`
- **Token URL:** `https://api.pinterest.com/v5/oauth/token`
- **Required Body Parameters:** `grant_type`, `code`, `redirect_uri`
- **Do NOT include:** client_id or client_secret in request body

### Current Configuration
```typescript
{
  authUrl: 'https://www.pinterest.com/oauth/',
  tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
  authMethod: 'basic_auth',
  scope: 'boards:read,pins:read,pins:write',
  redirectUri: 'https://pubhub.dev/api/oauth/callback/pinterest'
}
```

## Common Issues

1. **App Secret Mismatch:** Most common cause - verify secret matches exactly
2. **Redirect URI Mismatch:** Must match exactly (Pinterest is case-sensitive)
3. **App Not Approved:** Some apps need manual approval for certain scopes
4. **Trial Access Limitations:** Trial access works for OAuth but pins are private

## Testing Steps

After verifying credentials in Pinterest console:

1. Go to pubhub.dev → Connect Platform → Pinterest
2. Click "Connect" to start OAuth flow
3. Authorize on Pinterest
4. Check if token exchange succeeds

## Error Codes Reference

- **Code 2:** Authentication failed (invalid credentials or configuration)
- **Code 7:** Redirect URI mismatch
- **Code 1:** General error (check app status)

## Next Steps

1. Verify credentials in Pinterest Developer Console
2. Update credentials if needed (see "How to Update Credentials" above)
3. Test OAuth flow again
4. If still failing, check Pinterest app status and approval

## Useful Links

- Pinterest Developer Console: https://developers.pinterest.com/apps
- Pinterest OAuth v5 Docs: https://developers.pinterest.com/docs/api/v5/oauth-token/
- Pinterest Getting Started: https://developers.pinterest.com/docs/getting-started/
