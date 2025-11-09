# Sentry Testing Guide

## Quick Test Instructions

### Prerequisites
Ensure `VITE_SENTRY_DEBUG=true` is in your `.env` file (REQUIRED for local testing).

### Step-by-Step Testing

#### 1. Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

#### 2. Open Browser Console
- Press F12 to open DevTools
- Go to Console tab

#### 3. Test Error Capture
```javascript
// Test 1: Throw an error (should be caught by Sentry)
throw new Error('Sentry Test Error - ' + new Date().toISOString());

// Test 2: Capture a message
window.Sentry.captureMessage('Sentry Test Message - ' + new Date().toISOString(), 'info');

// Test 3: Capture with context
window.Sentry.captureException(new Error('Test with context'), {
  tags: { test: 'console' },
  level: 'error'
});
```

#### 4. Verify in Sentry Dashboard
1. Go to: https://devconsul.sentry.io/issues/?project=4510251337580544
2. Look for your test errors/messages (may take 10-30 seconds)
3. Click on an issue to see full details including:
   - Stack trace
   - Breadcrumbs
   - Session replay (if error occurred during recording)
   - Device/browser info

### Expected Console Output

When Sentry is working correctly, you should see:
```
[Sentry] Event captured successfully
```

If you see nothing or errors, check:
1. ✅ `VITE_SENTRY_DEBUG=true` in .env
2. ✅ Dev server was restarted after adding the env var
3. ✅ No console errors about Sentry initialization
4. ✅ Network tab shows requests to `sentry.io`

## Using Test Component

### 1. Import and Add to Your App
```tsx
// In App.tsx or any component
import { SentryTestButton } from './components/SentryTestButton';

function App() {
  return (
    <div>
      {/* Add this temporarily for testing */}
      {import.meta.env.MODE === 'development' && <SentryTestButton />}

      {/* Your other components */}
    </div>
  );
}
```

### 2. Click Test Buttons
- **Test Error Tracking**: Throws an error that Sentry should capture
- **Test Message Capture**: Sends an info message to Sentry

### 3. Remove After Testing
Once verified, remove the `<SentryTestButton />` component.

## Troubleshooting

### "Sentry is not defined" Error
**Cause**: Dev server wasn't restarted after adding `VITE_SENTRY_DEBUG=true`

**Fix**:
```bash
# Stop dev server (Ctrl+C)
npm run dev
```

### No Events Showing in Dashboard
**Possible causes**:

1. **`VITE_SENTRY_DEBUG` not set**
   - Check: `cat .env | grep VITE_SENTRY_DEBUG`
   - Should show: `VITE_SENTRY_DEBUG=true`

2. **Wrong DSN or environment variables**
   - Check: `cat .env | grep SENTRY`
   - Should have valid `VITE_SENTRY_DSN`

3. **Sentry is blocking events**
   - Check browser console for Sentry errors
   - Check Network tab for failed requests to sentry.io

4. **Ad blocker is blocking Sentry**
   - Disable ad blocker temporarily
   - Or whitelist `*.sentry.io`

### Events Captured But Not Visible
**Cause**: Wrong project selected in dashboard

**Fix**: Ensure you're viewing the correct project:
- Project: `sentry-pubhub`
- Org: `devconsul`
- URL: https://devconsul.sentry.io/issues/?project=4510251337580544

## Production Testing

### Before Deploying
1. Remove or comment out test components
2. Verify `VITE_SENTRY_DEBUG` is NOT set in production env vars
3. Build and check for Sentry plugin output:
   ```bash
   npm run build
   # Should see: [sentry-vite-plugin] Info: ...
   ```

### After Deploying
1. Visit your production site
2. Open console and trigger a test error (use browser console only)
3. Check Sentry dashboard for the error
4. Verify source maps are working (stack trace shows actual source code)

## Monitoring Best Practices

### Set User Context
When a user logs in, set their context:
```typescript
import * as Sentry from '@sentry/react';

Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username
});

// On logout
Sentry.setUser(null);
```

### Add Breadcrumbs
Track user actions for debugging:
```typescript
Sentry.addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to settings',
  level: 'info'
});
```

### Custom Tags
Categorize errors:
```typescript
Sentry.setTag('feature', 'authentication');
Sentry.setTag('user_type', 'premium');
```

## Sample Rates

Current configuration (src/sentry.ts):

**Development**:
- Traces: 100%
- Session Replay: 100%
- Profiles: 100%
- Events: Sent when `VITE_SENTRY_DEBUG=true`

**Production**:
- Traces: 10%
- Session Replay: 10%
- Error Replay: 100%
- Profiles: 10%

### Adjusting Sample Rates
Edit `src/sentry.ts` to change sample rates based on your needs.

## Additional Resources

- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Vite Plugin Docs](https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/vite/)
- [Your Sentry Project](https://devconsul.sentry.io/issues/?project=4510251337580544)
