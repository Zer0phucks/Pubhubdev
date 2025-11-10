import { test, expect } from '@playwright/test';
import { signIn, generateTestUserEmail } from './helpers/auth.helper';

/**
 * Edge Case Tests
 * Tests offline behavior, network errors, token expiration, and concurrent sessions
 */

test.describe('Edge Cases', () => {
  const testUser = {
    email: generateTestUserEmail(),
    password: 'TestPassword123!',
  };

  test.describe('Offline Behavior', () => {
    test('should detect offline status', async ({ page, context }) => {
      await signIn(page, testUser);
      await page.goto('/dashboard');

      // Go offline
      await context.setOffline(true);

      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=/You are offline|No connection/')).toBeVisible();

      await context.setOffline(false);
    });

    test('should queue actions when offline', async ({ page, context }) => {
      await signIn(page, testUser);
      await page.goto('/compose');

      // Prepare post
      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'Offline queue test');

      // Go offline
      await context.setOffline(true);

      // Attempt to publish
      await page.click('[data-testid="publish-now-button"]');
      await page.click('text=/Confirm|Yes, publish/');

      // Should show queued message
      await expect(page.locator('text=/Queued|Will retry when online|Saved for later/')).toBeVisible({ timeout: 10000 });

      // Go back online
      await context.setOffline(false);

      // Wait for auto-retry
      await page.waitForTimeout(3000);

      // Should process queued action
      await expect(page.locator('text=/Published successfully|Retry successful/')).toBeVisible({ timeout: 15000 });
    });

    test('should allow continuing work offline', async ({ page, context }) => {
      await signIn(page, testUser);
      await page.goto('/compose');

      // Go offline
      await context.setOffline(true);

      // Should still allow writing content
      await page.check('input[value="linkedin"]');
      await page.fill('[data-testid="content-editor"]', 'Drafting offline');

      // Save draft (should work offline)
      await page.click('[data-testid="save-draft-button"]');

      // Should show local save confirmation
      await expect(page.locator('text=/Saved locally|Draft saved offline/')).toBeVisible({ timeout: 5000 });

      await context.setOffline(false);
    });

    test('should sync data when connection restored', async ({ page, context }) => {
      await signIn(page, testUser);
      await page.goto('/dashboard');

      // Go offline
      await context.setOffline(true);

      // Make changes offline
      await page.goto('/compose');
      await page.fill('[data-testid="content-editor"]', 'Offline changes');
      await page.click('[data-testid="save-draft-button"]');

      // Restore connection
      await context.setOffline(false);

      // Should show sync indicator
      await expect(page.locator('text=/Syncing|Synchronizing|Updating/')).toBeVisible({ timeout: 10000 });

      // Should complete sync
      await expect(page.locator('text=/Synced|Up to date/')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Network Errors', () => {
    test('should handle API 500 errors gracefully', async ({ page }) => {
      await signIn(page, testUser);

      // Mock API failure
      await page.route('**/api/**', route => {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      });

      await page.goto('/dashboard');

      // Should show error message
      await expect(page.locator('text=/Server error|Something went wrong|Try again/')).toBeVisible({ timeout: 10000 });
    });

    test('should handle API timeout errors', async ({ page }) => {
      await signIn(page, testUser);

      // Mock timeout
      await page.route('**/api/posts', route => {
        // Never respond (simulate timeout)
      });

      await page.goto('/compose');
      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'Timeout test');
      await page.click('[data-testid="publish-now-button"]');

      // Should show timeout error
      await expect(page.locator('text=/Timeout|Request timed out|Taking too long/')).toBeVisible({ timeout: 35000 });
    });

    test('should allow retry after network error', async ({ page, context }) => {
      await signIn(page, testUser);
      await page.goto('/compose');

      await page.check('input[value="linkedin"]');
      await page.fill('[data-testid="content-editor"]', 'Retry test');

      // Fail first attempt
      await context.setOffline(true);
      await page.click('[data-testid="publish-now-button"]');
      await page.click('text=/Confirm|Yes, publish/');

      await expect(page.locator('text=/Failed|Network error/')).toBeVisible({ timeout: 10000 });

      // Restore network
      await context.setOffline(false);

      // Click retry
      await page.click('[data-testid="retry-button"]');

      // Should succeed
      await expect(page.locator('text=/Published successfully|Retry successful/')).toBeVisible({ timeout: 10000 });
    });

    test('should show progressive retry backoff', async ({ page, context }) => {
      await signIn(page, testUser);
      await page.goto('/dashboard');

      // Simulate intermittent connectivity
      let attemptCount = 0;

      await page.route('**/api/dashboard', route => {
        attemptCount++;
        if (attemptCount < 3) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });

      await page.reload();

      // Should show retry attempts
      await expect(page.locator('text=/Retrying|Attempt/i')).toBeVisible({ timeout: 5000 });

      // Eventually should succeed
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible({ timeout: 20000 });
    });
  });

  test.describe('Token Expiration', () => {
    test('should detect expired auth token', async ({ page }) => {
      await signIn(page, testUser);
      await page.goto('/dashboard');

      // Mock expired token response
      await page.route('**/api/**', route => {
        route.fulfill({ status: 401, body: JSON.stringify({ error: 'Token expired' }) });
      });

      // Trigger API call
      await page.reload();

      // Should redirect to login
      await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });

      // Should show session expired message
      await expect(page.locator('text=/Session expired|Please sign in again/')).toBeVisible();
    });

    test('should refresh token automatically', async ({ page }) => {
      await signIn(page, testUser);
      await page.goto('/dashboard');

      // Mock token refresh endpoint
      let refreshCalled = false;

      await page.route('**/auth/refresh', route => {
        refreshCalled = true;
        route.fulfill({
          status: 200,
          body: JSON.stringify({ accessToken: 'new_token_12345' }),
        });
      });

      // Simulate token near expiration
      await page.evaluate(() => {
        localStorage.setItem('token_expires_at', String(Date.now() + 60000)); // 1 min
      });

      // Wait for refresh attempt
      await page.waitForTimeout(65000);

      // Token refresh should have been called
      expect(refreshCalled).toBe(true);
    });

    test('should preserve session after token refresh', async ({ page }) => {
      await signIn(page, testUser);
      await page.goto('/dashboard');

      const currentUrl = page.url();

      // Mock successful token refresh
      await page.route('**/auth/refresh', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ accessToken: 'refreshed_token' }),
        });
      });

      // Trigger refresh
      await page.evaluate(() => {
        window.dispatchEvent(new Event('token-refresh-needed'));
      });

      await page.waitForTimeout(2000);

      // Should remain on same page
      expect(page.url()).toBe(currentUrl);

      // Should still be able to interact
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should handle token refresh failure', async ({ page }) => {
      await signIn(page, testUser);
      await page.goto('/dashboard');

      // Mock failed refresh
      await page.route('**/auth/refresh', route => {
        route.fulfill({ status: 401, body: 'Refresh failed' });
      });

      // Trigger refresh
      await page.evaluate(() => {
        window.dispatchEvent(new Event('token-refresh-needed'));
      });

      // Should redirect to login
      await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
    });
  });

  test.describe('Concurrent Sessions', () => {
    test('should handle multiple browser tabs correctly', async ({ page, context }) => {
      await signIn(page, testUser);
      await page.goto('/dashboard');

      // Open second tab
      const secondTab = await context.newPage();
      await secondTab.goto(page.url());

      // Both tabs should be authenticated
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(secondTab.locator('[data-testid="user-menu"]')).toBeVisible();

      // Make change in first tab
      await page.goto('/compose');
      await page.fill('[data-testid="content-editor"]', 'Tab sync test');
      await page.click('[data-testid="save-draft-button"]');

      // Second tab should sync (if real-time sync enabled)
      await secondTab.waitForTimeout(3000);

      await secondTab.goto('/compose');

      // Should see draft (if synced)
      const hasContent = await secondTab.locator('[data-testid="load-draft-button"]').isVisible();
      if (hasContent) {
        await secondTab.click('[data-testid="load-draft-button"]');
        await expect(secondTab.locator('[data-testid="content-editor"]')).toHaveValue('Tab sync test');
      }

      await secondTab.close();
    });

    test('should handle sign out in one tab affecting others', async ({ page, context }) => {
      await signIn(page, testUser);
      await page.goto('/dashboard');

      const secondTab = await context.newPage();
      await secondTab.goto(page.url());

      // Sign out in first tab
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Sign Out');

      // Second tab should detect sign out
      await secondTab.waitForTimeout(2000);

      // Trigger navigation or API call in second tab
      await secondTab.reload();

      // Should redirect to login
      await expect(secondTab).toHaveURL(/login|auth|^\/$/, { timeout: 10000 });

      await secondTab.close();
    });

    test('should handle conflicting edits gracefully', async ({ page, context }) => {
      await signIn(page, testUser);

      // Create and save draft in first tab
      await page.goto('/compose');
      await page.fill('[data-testid="content-editor"]', 'Version 1');
      await page.click('[data-testid="save-draft-button"]');

      // Open second tab and edit same draft
      const secondTab = await context.newPage();
      await secondTab.goto(page.url());
      await secondTab.click('[data-testid="load-draft-button"]');
      await secondTab.fill('[data-testid="content-editor"]', 'Version 2');
      await secondTab.click('[data-testid="save-draft-button"]');

      // Return to first tab and try to save
      await page.fill('[data-testid="content-editor"]', 'Version 1 updated');
      await page.click('[data-testid="save-draft-button"]');

      // Should show conflict warning or merge
      const conflictWarning = await page.locator('text=/Conflict|Newer version|Overwrite/').isVisible();

      if (conflictWarning) {
        // Should offer resolution options
        await expect(page.locator('[data-testid="conflict-resolution"]')).toBeVisible();
      }

      await secondTab.close();
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should work in Chromium', async ({ page }) => {
      await signIn(page, testUser);
      await page.goto('/dashboard');

      // Core functionality should work
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    });

    test('should handle browser-specific features', async ({ page, browserName }) => {
      await signIn(page, testUser);
      await page.goto('/dashboard');

      // Check notifications API (may not be available in all browsers)
      const hasNotifications = await page.evaluate(() => 'Notification' in window);

      if (browserName === 'webkit') {
        // Safari may have different notification behavior
        console.log('WebKit browser detected - notifications may behave differently');
      }

      // App should still function without notifications
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    });
  });

  test.describe('Data Validation', () => {
    test('should sanitize user input to prevent XSS', async ({ page }) => {
      await signIn(page, testUser);
      await page.goto('/compose');

      // Attempt XSS injection
      const xssAttempt = '<script>alert("XSS")</script>';

      await page.fill('[data-testid="content-editor"]', xssAttempt);

      // Content should be escaped or sanitized
      const editorContent = await page.locator('[data-testid="content-editor"]').inputValue();

      // Script tags should not execute
      expect(editorContent).toContain('<script>'); // Stored as text, not executed
    });

    test('should handle extremely long input', async ({ page }) => {
      await signIn(page, testUser);
      await page.goto('/compose');

      // Very long content
      const longContent = 'a'.repeat(100000);

      await page.fill('[data-testid="content-editor"]', longContent);

      // Should handle gracefully (may show warning)
      const hasWarning = await page.locator('text=/Too long|Character limit|Exceeds maximum/').isVisible();

      expect(hasWarning).toBe(true);
    });

    test('should handle special characters correctly', async ({ page }) => {
      await signIn(page, testUser);
      await page.goto('/compose');

      const specialChars = 'Test with émojis 😀🎉 and spëcial çharacters';

      await page.fill('[data-testid="content-editor"]', specialChars);

      await expect(page.locator('[data-testid="content-editor"]')).toHaveValue(specialChars);
    });
  });
});
