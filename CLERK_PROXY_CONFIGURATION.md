# Clerk Custom Domain Proxy Configuration

## Current Issue

Clerk is trying to load npm packages from `clerk.pubhub.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js`, but the custom domain proxy only serves the **Frontend API**, not npm packages.

## Understanding Clerk's Custom Domain Proxy

Clerk's custom domain proxy is designed to proxy the **Frontend API** (authentication endpoints), not npm package delivery. The proxy configuration is:

### Frontend API Proxy Setup

1. **Proxy Path**: `/__clerk/` (or custom path)
2. **Target**: `https://frontend-api.clerk.dev/` (or `frontend-api.clerk.services` for custom domain)
3. **Required Headers**:
   - `Clerk-Proxy-Url`: Full URL of your proxy endpoint (e.g., `https://pubhub.dev/__clerk`)
   - `Clerk-Secret-Key`: Your Clerk secret key
   - `X-Forwarded-For`: Original client IP address

### Configuration in Clerk Dashboard

1. Go to **Configure** > **Domains**
2. Under **Frontend API** section, click **Advanced**
3. Enter your proxy URL (e.g., `https://pubhub.dev/__clerk`)
4. Clerk will validate the proxy configuration

## The Problem

When you configure a custom domain (`clerk.pubhub.dev`), Clerk tries to load **everything** from that domain, including:
- Frontend API calls ✅ (works with proxy)
- NPM packages ❌ (doesn't work - proxy doesn't serve npm packages)

## Solutions

### Option 1: Remove Custom Domain (Recommended)

The simplest solution is to **not use a custom domain** for Clerk. Clerk's default CDN (`clerk.com`) works perfectly fine and serves npm packages correctly.

**Steps:**
1. Go to Clerk Dashboard > Configure > Domains
2. Remove or disable `clerk.pubhub.dev` custom domain
3. Clerk will automatically use `clerk.com` CDN
4. Redeploy your app

### Option 2: Use Custom Domain Only for Frontend API (Advanced)

If you need the custom domain for Frontend API proxying:

1. **Keep custom domain** for Frontend API proxy
2. **Configure ClerkProvider** to use default CDN for npm packages

However, this may not be possible with Clerk's current implementation, as the publishable key determines the domain.

### Option 3: Set Up Separate NPM Package Proxy (Complex)

You would need to:
1. Set up a separate CDN/proxy for npm packages
2. Configure your app to load Clerk from that CDN
3. This is complex and not recommended

## Recommended Configuration

**For most use cases, use Clerk's default CDN:**

- ✅ Works out of the box
- ✅ Serves npm packages correctly
- ✅ No proxy configuration needed
- ✅ Better performance (Clerk's CDN is optimized)

**Only use custom domain if:**
- You need to proxy Frontend API through your domain
- You have specific compliance/security requirements
- You're willing to handle npm package loading separately

## Current Status

- ✅ DNS configured correctly (`clerk.pubhub.dev` → `frontend-api.clerk.services`)
- ✅ Custom domain verified in Clerk dashboard
- ❌ NPM packages fail to load (proxy doesn't serve them)
- ✅ App loads correctly (ReferenceError fixed)
- ❌ OAuth blocked (Clerk not initialized due to script loading failure)

## Next Steps

1. **Remove custom domain** in Clerk dashboard (quickest fix)
2. OR configure a separate solution for npm package delivery
3. Test OAuth after Clerk loads successfully

