# WordPress Integration Testing

## Current Status

The WordPress integration is **fully implemented** and working, but requires **real WordPress credentials** to test.

## Why Test Credentials Don't Work

The endpoint validates credentials by calling the WordPress REST API at `/wp-json/wp/v2/users/me`. Test credentials like:
- Site URL: `https://test.wordpress.com`
- Username: `testuser`
- Password: `test1234 5678 9012 3456`

...will fail validation because they're not real WordPress credentials.

## How to Test Properly

### Option 1: Use a Real WordPress Site

1. **Get a WordPress site** (WordPress.com, self-hosted, or local install)
2. **Enable Application Passwords**:
   - Go to: WordPress Admin → Users → Your Profile
   - Scroll to "Application Passwords"
   - Create a new application password for "PubHub"
3. **Connect in PubHub**:
   - Site URL: Your actual WordPress URL
   - Username: Your WordPress username
   - Application Password: The generated password

### Option 2: Use WordPress.com Free Site

1. Go to wordpress.com and create a free site
2. Your site URL will be: `https://yoursite.wordpress.com`
3. In your WordPress.com account, go to Security settings
4. Create an Application Password
5. Use these real credentials in PubHub

## Implementation Details

**Backend Endpoint**: `supabase/functions/make-server-19ccd85e/index.ts:1867-1939`

The endpoint:
1. Validates credentials by calling `{siteUrl}/wp-json/wp/v2/users/me`
2. Encrypts credentials with AES-256-GCM
3. Stores encrypted credentials in KV store
4. Updates project connections

**Frontend Component**: `src/components/WordPressConnectionDialog.tsx`

Features:
- Setup instructions with toggle
- URL validation and formatting
- Application password input with space handling
- Secure credential transmission

## Error Handling

If connection fails, check:
1. **Site URL is correct** - Must be accessible and running WordPress 5.6+
2. **Application Passwords are enabled** - Required for WordPress API access
3. **Username is correct** - Must match WordPress admin username
4. **Password is valid** - Must be a freshly generated Application Password (not your regular password)

## Next Steps

To fully test the WordPress integration, you need to either:
1. Create a free WordPress.com site
2. Set up a local WordPress instance
3. Use an existing WordPress site you have access to

Once you have real credentials, the integration will work perfectly!
