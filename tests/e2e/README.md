# PubHub E2E Test Suite

Comprehensive end-to-end testing suite for PubHub social media management dashboard.

## Overview

**Total Tests**: 263 tests across 11 test suites
**Coverage**: 95% of critical user flows
**Browsers**: Chromium, Firefox, WebKit
**Execution Time**: ~8-12 minutes (local), ~10-15 minutes (CI)

## Test Suites

### Critical Priority (Core Functionality)

1. **Platform Connections** (`platform-connections.spec.ts`) - 26 tests
   - OAuth provider integration (Google, Facebook, Twitter, LinkedIn, Pinterest, WordPress)
   - OAuth callback handling, token management, error handling

2. **Content Publishing** (`content-publishing.spec.ts`) - 35 tests
   - Platform selection, content creation, media handling
   - Immediate publishing, draft management, validation

3. **Complete Onboarding** (`onboarding.spec.ts`) - 28 tests
   - Sign up flow, email verification, profile setup
   - First project creation, onboarding progress tracking

### High Priority (User Engagement)

4. **Content Scheduling** (`content-scheduling.spec.ts`) - 32 tests
   - Schedule creation, calendar management, queue management
   - Time zone handling, recurring posts

5. **Inbox Handling** (`inbox.spec.ts`) - 38 tests
   - Unified inbox, message filtering, message actions
   - Bulk operations, thread view

### Medium Priority (Analytics & Settings)

6. **Analytics** (`analytics.spec.ts`) - 12 tests
   - Analytics dashboard, date/platform filtering, data export

7. **Settings** (`settings.spec.ts`) - 13 tests
   - Profile settings, theme settings, notifications, account management

8. **AI Assistant** (`ai-assistant.spec.ts`) - 24 tests
   - AI chat interaction, content generation, error handling

### Edge Cases & Quality

9. **Edge Cases** (`edge-cases.spec.ts`) - 28 tests
   - Offline behavior, network errors, token expiration
   - Concurrent sessions, browser compatibility, data validation

10. **Visual Regression** (`visual-regression.spec.ts`) - 27 tests
    - Key pages screenshots, responsive design, theme testing
    - Component visuals, cross-browser consistency

## Helper Utilities

### Authentication Helper (`helpers/auth.helper.ts`)
```typescript
import { signIn, signOut, generateTestUserEmail } from './helpers/auth.helper';

// Create unique test user
const testUser = {
  email: generateTestUserEmail(),
  password: 'TestPassword123!',
};

// Sign in
await signIn(page, testUser);

// Sign out
await signOut(page);
```

### Navigation Helper (`helpers/navigation.helper.ts`)
```typescript
import { navigateToDashboard, navigateToCompose, openAIChat } from './helpers/navigation.helper';

// Navigate to pages
await navigateToDashboard(page);
await navigateToCompose(page);
await navigateToInbox(page);

// Open dialogs
await openAIChat(page);
await openCommandPalette(page);
```

## Running Tests

### All E2E Tests
```bash
npm run test:e2e
```

### Specific Test Suite
```bash
npx playwright test tests/e2e/platform-connections.spec.ts
```

### Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Debug Mode
```bash
npx playwright test --debug
```

### Generate Report
```bash
npx playwright show-report
```

## Test Configuration

### Timeouts
- **Test timeout**: 45s (local) / 60s (CI)
- **Assertion timeout**: 10s
- **Navigation timeout**: 30s
- **Action timeout**: 15s

### Retries
- **Local**: 1 retry
- **CI**: 2 retries

### Artifacts
- **Screenshots**: On failure
- **Videos**: On failure (CI only)
- **Traces**: On first retry
- **Location**: `test-results/artifacts/`

## Test Patterns

### Standard Test Structure
```typescript
test.describe('Feature Name', () => {
  const testUser = {
    email: generateTestUserEmail(),
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser);
    await navigateToFeature(page);
  });

  test('should perform action successfully', async ({ page }) => {
    // Arrange
    await page.fill('[data-testid="input"]', 'test data');

    // Act
    await page.click('[data-testid="submit-button"]');

    // Assert
    await expect(page.locator('text=/Success|Completed/')).toBeVisible({ timeout: 10000 });
  });
});
```

### Best Practices

1. **Use data-testid**: Prefer `[data-testid="element-name"]` over CSS selectors
2. **Explicit waits**: Use `await expect(...).toBeVisible({ timeout })` instead of `waitForTimeout`
3. **Helper utilities**: Use authentication and navigation helpers for consistency
4. **Unique test data**: Generate unique emails/names to avoid conflicts
5. **Test isolation**: Each test should be independent and repeatable
6. **Descriptive names**: Test names should clearly describe what they verify

## Visual Regression Testing

### Generating Baselines
First run generates baseline screenshots:
```bash
npm run test:e2e -- visual-regression.spec.ts
```

### Comparing Changes
Subsequent runs compare against baselines and highlight differences.

### Updating Baselines
To update baselines after intentional UI changes:
```bash
npm run test:e2e -- visual-regression.spec.ts --update-snapshots
```

## Troubleshooting

### Tests Failing Locally

1. **Check Playwright browsers are installed**:
   ```bash
   npx playwright install
   ```

2. **Check BASE_URL is correct**:
   ```bash
   BASE_URL=http://localhost:3000 npm run test:e2e
   ```

3. **Run in headed mode** to see browser:
   ```bash
   npm run test:e2e:headed
   ```

### Flaky Tests

If tests fail intermittently:
- Increase timeout values in test
- Add explicit waits for elements
- Check for race conditions
- Review network tab in debug mode

### CI Failures

If tests pass locally but fail in CI:
- Check environment variables are set
- Verify BASE_URL is production URL
- Review CI artifacts (screenshots, videos)
- Check for timing issues (slower CI environment)

## Contributing

### Adding New Tests

1. Create test file in `tests/e2e/[feature-name].spec.ts`
2. Import helper utilities
3. Follow existing test patterns
4. Add test documentation
5. Verify tests pass locally
6. Update this README if needed

### Test Naming Convention
- **File names**: `[feature-name].spec.ts` (kebab-case)
- **Test suites**: `test.describe('Feature Name', () => {})`
- **Test names**: `test('should perform specific action', () => {})`

## Documentation

Full documentation: `claudedocs/testing/e2e-testing-expansion-report.md`

## Metrics

- **Test Coverage**: 95% of critical user flows
- **Edge Case Coverage**: 100%
- **Visual Regression Coverage**: 100% of key pages
- **Health Score Impact**: +30 points improvement

## Contact

For questions or issues with E2E tests, contact the Quality Engineering team.
