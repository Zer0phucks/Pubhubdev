# Clerk Custom Domain Setup

## Issue
Clerk is trying to load npm packages from `clerk.pubhub.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js` but failing:
```
Failed to load resource: net::ERR_FAILED
clerk.pubhub.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js
```

## Root Cause
The publishable key `pk_live_Y2xlcmsucHViaHViLmRldiQ` is configured with a custom domain (`clerk.pubhub.dev`). While DNS is correctly configured, **Clerk's custom domain proxy only serves the Frontend API, not npm packages**. When a custom domain is configured, Clerk tries to load everything (including npm packages) from that domain, but the proxy doesn't serve npm packages.

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
- ✅ DNS configured correctly (`clerk.pubhub.dev` → `frontend-api.clerk.services`)
- ✅ Custom domain verified in Clerk dashboard
- ✅ CSP updated to allow `clerk.pubhub.dev`
- ✅ MSW disabled in production
- ✅ PostHog import fixed
- ✅ ReferenceError fixed (Clerk isolated in separate chunk)
- ❌ NPM packages fail to load (custom domain proxy doesn't serve npm packages)

## Important Note

**Clerk's custom domain proxy is designed for Frontend API proxying, not npm package delivery.** The proxy configuration in Clerk dashboard only handles API requests, not static assets like npm packages.

## Next Steps
1. **Remove custom domain in Clerk dashboard** (recommended - simplest fix)
   - Clerk will automatically use default CDN (`clerk.com`) which serves npm packages correctly
2. OR keep custom domain but understand npm packages won't work through it
3. Redeploy after changes

