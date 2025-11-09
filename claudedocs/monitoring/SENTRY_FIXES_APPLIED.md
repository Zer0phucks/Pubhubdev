# Sentry Configuration Fixes Applied

## Date: 2025-11-09

## Issues Found and Fixed

### 1. Framework Mismatch (CRITICAL)
**Problem**: Next.js Sentry configuration files were present in a Vite/React project

**Files Removed**:
- `sentry.edge.config.ts` - Next.js edge runtime config
- `sentry.server.config.ts` - Next.js server config
- `src/instrumentation-client.ts` - Next.js client config
- `next.config.js` - Next.js configuration
- `src/pages/api/sentry-example-api.ts` - Next.js API route example
- `src/pages/sentry-example-page.tsx` - Next.js page example

**Impact**: These files were not being used and would have caused confusion. The correct configuration in `src/sentry.ts` is now the only Sentry initialization.

### 2. Wrong Environment Variable (CRITICAL)
**Problem**: Environment variable used Next.js naming convention instead of Vite

**Fixed**:
- Changed `NEXT_PUBLIC_SENTRY_DSN` → `VITE_SENTRY_DSN` in `.env`
- This was preventing Sentry from initializing because `src/sentry.ts` expects `import.meta.env.VITE_SENTRY_DSN`

**Impact**: **Sentry was NOT working before this fix.** The DSN was not being loaded.

### 3. Wrong Dependency
**Problem**: `@sentry/nextjs` package was installed but not needed

**Fixed**:
- Removed `@sentry/nextjs` from `package.json`
- Ran `npm uninstall @sentry/nextjs`
- Removed 133 unused Next.js-related packages

**Impact**: Reduced bundle size and eliminated dependency conflicts.

## Correct Configuration (Now Active)

### Files:
- ✅ `src/sentry.ts` - Vite/React Sentry initialization
- ✅ `vite.config.ts` - Sentry Vite plugin for source maps
- ✅ `src/main.tsx` - Imports Sentry on app start

### Environment Variables (.env):
```bash
VITE_SENTRY_DSN="https://f400c21bed0184aa960502392fd26c57@o4510074583842816.ingest.us.sentry.io/4510251337580544"
SENTRY_ORG="devconsul"
SENTRY_PROJECT="sentry-pubhub"
SENTRY_AUTH_TOKEN="..." # For source map uploads

# IMPORTANT: Enable Sentry in development mode
VITE_SENTRY_DEBUG=true
```

**⚠️ CRITICAL**: By default, Sentry does NOT send events in development mode (see `src/sentry.ts:27-29`). You MUST set `VITE_SENTRY_DEBUG=true` to test Sentry locally.

### Dependencies:
- `@sentry/react` ^10.22.0 - Core Sentry SDK for React
- `@sentry/vite-plugin` ^4.5.0 - Build plugin for source maps

## Features Now Working

1. **Error Tracking**: JavaScript errors and unhandled rejections
2. **Performance Monitoring**: Page loads and interactions
3. **Session Replay**: User session recording for debugging
4. **Source Maps**: Automatic upload during build for better stack traces
5. **Environment-based Config**: Different sample rates for dev/prod

## Configuration Details

### Sample Rates (src/sentry.ts):
- **Production**:
  - Traces: 10%
  - Session Replay: 10%
  - Error Replay: 100%
  - Profiles: 10%

- **Development**:
  - Traces: 100%
  - Session Replay: 100%
  - Error Replay: 100%
  - Profiles: 100%
  - Events blocked unless `VITE_SENTRY_DEBUG=true`

### Privacy Settings:
- Text masking: Disabled (set to `false`)
- Media blocking: Disabled (set to `false`)
- User PII: Not automatically sent (configure via `setUser()`)

## Testing Sentry

**IMPORTANT**: Make sure `VITE_SENTRY_DEBUG=true` is set in your `.env` file, then reload the dev server!

### Option 1: Use Test Component
Add the test button to your app temporarily:

```tsx
import { SentryTestButton } from './components/SentryTestButton';

// In your component:
<SentryTestButton />
```

### Option 2: Manual Testing in Console

**Step 1**: Reload your dev server after adding `VITE_SENTRY_DEBUG=true`:
```bash
# Stop dev server (Ctrl+C), then:
npm run dev
```

**Step 2**: Open browser console (F12) and run:

```javascript
// Sentry is now globally available in development
window.Sentry.captureMessage('Test message from console', 'info');

// Or test error capture
throw new Error('Test error for Sentry');
```

**Step 3**: Check your Sentry dashboard for the events

### Verify in Sentry Dashboard
- Project: `sentry-pubhub`
- Organization: `devconsul`
- Dashboard URL: `https://devconsul.sentry.io/issues/?project=4510251337580544`

## Vercel Deployment

Make sure these environment variables are set in Vercel:

1. `VITE_SENTRY_DSN` - Your Sentry DSN (required)
2. `SENTRY_ORG` - Organization slug (for source maps)
3. `SENTRY_PROJECT` - Project slug (for source maps)
4. `SENTRY_AUTH_TOKEN` - Auth token (for source maps)

## Next Steps

1. ✅ Remove test files from git tracking if committed
2. ✅ Test error reporting in development
3. ✅ Deploy to staging and verify in production
4. ✅ Configure user context when auth is implemented
5. ✅ Set up Sentry alerts for critical errors

## References

- Sentry Vite/React Guide: https://docs.sentry.io/platforms/javascript/guides/react/
- Vite Plugin Docs: https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/vite/
- Project Documentation: `claudedocs/monitoring/SENTRY_SETUP.md`
