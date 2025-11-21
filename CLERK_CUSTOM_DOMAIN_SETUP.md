# Clerk Custom Domain Setup

## Issue
Clerk is trying to load from `clerk.pubhub.dev` but the domain is not configured, causing:
```
Failed to load resource: net::ERR_FAILED
clerk.pubhub.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js
```

## Root Cause
The publishable key `pk_live_Y2xlcmsucHViaHViLmRldiQ` is configured with a custom domain (`clerk.pubhub.dev`) in the Clerk dashboard, but the DNS is not set up.

## Solutions

### Option 1: Remove Custom Domain (Recommended for now)
1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to your application settings
3. Go to "Domains" section
4. Remove or disable the custom domain `clerk.pubhub.dev`
5. Clerk will automatically use the default CDN (`clerk.com`)

### Option 2: Set Up Custom Domain DNS
If you want to use the custom domain:
1. In Clerk Dashboard, go to "Domains" section
2. Add `clerk.pubhub.dev` as a custom domain
3. Clerk will provide DNS records (CNAME)
4. Add the CNAME record to your DNS provider for `pubhub.dev`
5. Wait for DNS propagation (can take up to 48 hours)

### Option 3: Use Different Publishable Key
Create a new Clerk application without custom domain configuration and use that publishable key instead.

## Current Status
- ✅ CSP updated to allow `clerk.pubhub.dev`
- ⚠️ DNS not configured - Clerk will fail to load until domain is set up or removed
- ✅ MSW disabled in production
- ✅ PostHog import fixed

## Next Steps
1. Remove custom domain in Clerk dashboard (quickest fix)
2. OR set up DNS for `clerk.pubhub.dev`
3. Redeploy after DNS changes (if using Option 2)

