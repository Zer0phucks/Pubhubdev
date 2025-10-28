# OAuth CI Testing Setup

Comprehensive guide for OAuth smoke tests and per-platform post-connect validation in CI/CD.

## Overview

This setup includes three types of OAuth testing:
1. **OAuth Smoke Tests** - Validate OAuth authorization endpoints work correctly
2. **Callback Verification** - Test OAuth callback URL handling
3. **Post-Connect Validation** - Verify platform connections appear correctly in UI after OAuth

## CI Workflow

### OAuth Smoke Test Job

**File**: `.github/workflows/oauth-smoke-test.yml`

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Daily at 2 AM UTC (scheduled)

**What it tests**:
- Calls `/oauth/authorize/{platform}` endpoint for each platform
- Verifies `authUrl` and `state` are returned
- Checks environment variables are configured correctly
- Reports which platforms pass/fail

**Required secrets**:
```yaml
# Supabase
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_PROJECT_ID
SUPABASE_ACCESS_TOKEN  # OR use SUPABASE_TEST_EMAIL + SUPABASE_TEST_PASSWORD
TEST_PROJECT_ID

# Per-Platform OAuth (see full list in workflow file)
TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_REDIRECT_URI
INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, INSTAGRAM_REDIRECT_URI
LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI
FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_REDIRECT_URI
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI
TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI
PINTEREST_APP_ID, PINTEREST_APP_SECRET, PINTEREST_REDIRECT_URI
REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_REDIRECT_URI
```

### OAuth Callback Verification Job

**What it tests**:
- OAuth callback URL structure is correct
- Callback handles missing parameters gracefully
- All platform callback URLs are unique
- Supabase auth callback works

**Per-Platform Post-Connect Validation** (CI-only):
- Navigates to Project Settings → Connections after OAuth
- Verifies "Connected" badge appears for each platform
- Checks username/handle is displayed
- Validates auto-post toggle is available
- Confirms disconnect button is present
- Takes screenshots for each platform

**Test IDs Required in UI**:
```typescript
// Project Settings navigation
[data-testid="project-settings"]

// Connections tab
button:has-text("Connections")

// Connections list container
[data-testid="platform-connections"]

// Per-platform cards
[data-testid="platform-{platform}"]  // e.g., platform-twitter

// Platform details
[data-testid="platform-username"]
[data-testid="auto-post-toggle"]
button:has-text("Disconnect")
button:has-text("Connect")
```

## Running Tests Locally

### OAuth Smoke Test

```bash
# Set environment variables in .env file
npm run test:oauth:smoke

# Test specific platforms only
npm run test:oauth:smoke twitter linkedin
```

### Callback Verification (Local)

```bash
# Basic callback URL tests (no auth required)
npx playwright test tests/e2e/oauth-callback-verification.ts

# Post-connect validation tests (requires CI=true and real OAuth)
CI=true npx playwright test tests/e2e/oauth-callback-verification.ts
```

### Interactive Dashboard Tests

```bash
# These tests are skipped locally by default to avoid timeouts
# Run with CI flag to enable
CI=true npx playwright test tests/e2e/project-management.spec.ts
CI=true npx playwright test tests/e2e/content-creation.spec.ts
```

## Test Gating Strategy

### CI-Only Tests

Tests that require authentication or are time-consuming are gated behind `CI` flag:

```typescript
test.describe('My Test Suite', () => {
  test.skip(!process.env.CI, 'Test only runs in CI environment');

  // ... test cases
});
```

**Gated tests**:
- Per-platform post-connect validation (requires real OAuth tokens)
- Interactive dashboard tests (avoid timeout issues locally)
- Project management flows
- Content creation workflows

### Always-Run Tests

Tests that run both locally and in CI:
- OAuth callback URL structure validation
- Error handling verification
- Static configuration checks

## Adding New Platforms

When adding a new OAuth platform:

1. **Add to smoke test script** (`scripts/oauth-flow-smoke-test.mjs`):
```javascript
const PLATFORM_REQUIREMENTS = {
  // ... existing platforms
  newplatform: [
    ['NEWPLATFORM_CLIENT_ID'],
    ['NEWPLATFORM_CLIENT_SECRET'],
    ['NEWPLATFORM_REDIRECT_URI', 'FRONTEND_URL']
  ]
};
```

2. **Add secrets to CI workflow** (`.github/workflows/oauth-smoke-test.yml`):
```yaml
env:
  NEWPLATFORM_CLIENT_ID: ${{ secrets.NEWPLATFORM_CLIENT_ID }}
  NEWPLATFORM_CLIENT_SECRET: ${{ secrets.NEWPLATFORM_CLIENT_SECRET }}
  NEWPLATFORM_REDIRECT_URI: ${{ secrets.NEWPLATFORM_REDIRECT_URI }}
```

3. **Add to callback verification** (`tests/e2e/oauth-callback-verification.ts`):
```typescript
const PLATFORMS = [
  // ... existing platforms
  'newplatform'
] as const;
```

4. **Set GitHub Secrets** in repository settings

## Monitoring & Alerts

### Scheduled Test Failures

When the daily OAuth smoke test fails:
- GitHub issue automatically created with label `oauth`, `ci-failure`, `automated`
- Issue contains link to failed workflow run
- Review and fix OAuth configuration or provider changes

### Manual Review

Check artifacts after each run:
- `oauth-smoke-test-results/` - Smoke test logs
- `oauth-callback-test-results/` - Playwright reports and screenshots
- `test-results/post-connect-{platform}.png` - UI validation screenshots

## Troubleshooting

### Smoke Test Failures

**"Missing env vars"**:
- Platform skipped due to missing OAuth credentials
- Non-blocking - test continues with other platforms
- Add missing secrets in GitHub repository settings

**"Authorize failed"**:
- OAuth endpoint returned error
- Check Edge Function logs in Supabase
- Verify OAuth app credentials are correct
- Ensure redirect URIs match exactly

**"Failed to obtain Supabase access token"**:
- Check `SUPABASE_ACCESS_TOKEN` secret
- Or verify `SUPABASE_TEST_EMAIL` + `SUPABASE_TEST_PASSWORD` work
- Ensure test user account exists in Supabase Auth

### Post-Connect Validation Failures

**"Platform not connected"**:
- OAuth flow didn't complete successfully
- Check Supabase logs for callback errors
- Verify state parameter validation

**"Element not found"**:
- UI test IDs may have changed
- Update test selectors in `oauth-callback-verification.ts`
- Check that PlatformConnections component renders correctly

**Timeouts**:
- Increase timeout in test: `{ timeout: 10000 }`
- Check network conditions in CI
- Verify Supabase edge functions are responsive

### Interactive Test Failures

**"Tests skipped locally"**:
- Expected behavior - interactive tests only run in CI
- Use `CI=true` to force run locally
- Or run full test suite: `npm run test:e2e`

## Best Practices

1. **Environment Parity**: Keep local `.env` and CI secrets in sync
2. **Incremental Testing**: Test one platform at a time when debugging
3. **Screenshot Review**: Always check screenshots in failed test artifacts
4. **Log Inspection**: Review Supabase Edge Function logs for API errors
5. **Token Refresh**: Rotate OAuth app secrets if tests consistently fail
6. **Daily Monitoring**: Review scheduled test results to catch provider changes

## Performance Optimization

**Playwright Config**:
- CI timeout: 60s per test
- Local timeout: 30s per test
- Retries: 2 on CI, 0 locally
- Workers: 1 on CI (sequential), unlimited locally

**Test Parallelization**:
- Smoke tests run all platforms in sequence
- Callback verification runs in parallel
- Post-connect validation runs sequentially per platform

## Security Notes

- OAuth credentials stored as GitHub repository secrets
- Never commit credentials to code
- Test accounts should have minimal permissions
- Rotate secrets regularly
- Monitor for unusual OAuth activity in logs
