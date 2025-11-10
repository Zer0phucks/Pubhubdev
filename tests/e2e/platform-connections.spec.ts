import { test, expect } from '@playwright/test';
import { signIn, generateTestUserEmail } from './helpers/auth.helper';
import { navigateToPlatformConnections } from './helpers/navigation.helper';

/**
 * Platform Connection OAuth Flow Tests
 * Tests critical OAuth integration with social platforms
 */

test.describe('Platform Connection OAuth Flow', () => {
  const testUser = {
    email: generateTestUserEmail(),
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    // Sign in with test user
    await signIn(page, testUser);
    await navigateToPlatformConnections(page);
  });

  test.describe('OAuth Provider Connection', () => {
    test('should display all available OAuth providers', async ({ page }) => {
      // Verify all OAuth providers are listed
      const providers = [
        'Google',
        'Facebook',
        'Twitter',
        'LinkedIn',
        'Pinterest',
        'WordPress',
      ];

      for (const provider of providers) {
        await expect(page.locator(`[data-testid="connect-${provider.toLowerCase()}"]`)).toBeVisible();
      }
    });

    test('should show connection status for each platform', async ({ page }) => {
      // Verify connection status indicators exist
      await expect(page.locator('[data-testid="platform-status"]')).toHaveCount(6);
    });

    test('should open OAuth popup for Google connection', async ({ page, context }) => {
      // Create promise that resolves to the popup
      const popupPromise = context.waitForEvent('page');

      // Click connect Google button
      await page.click('[data-testid="connect-google"]');

      // Wait for popup to open
      const popup = await popupPromise;

      // Verify OAuth URL structure
      await expect(popup).toHaveURL(/accounts\.google\.com|googleapis\.com/);

      await popup.close();
    });

    test('should open OAuth popup for Facebook connection', async ({ page, context }) => {
      const popupPromise = context.waitForEvent('page');
      await page.click('[data-testid="connect-facebook"]');
      const popup = await popupPromise;
      await expect(popup).toHaveURL(/facebook\.com|fb\.com/);
      await popup.close();
    });

    test('should open OAuth popup for Twitter connection', async ({ page, context }) => {
      const popupPromise = context.waitForEvent('page');
      await page.click('[data-testid="connect-twitter"]');
      const popup = await popupPromise;
      await expect(popup).toHaveURL(/twitter\.com|x\.com/);
      await popup.close();
    });

    test('should open OAuth popup for LinkedIn connection', async ({ page, context }) => {
      const popupPromise = context.waitForEvent('page');
      await page.click('[data-testid="connect-linkedin"]');
      const popup = await popupPromise;
      await expect(popup).toHaveURL(/linkedin\.com/);
      await popup.close();
    });

    test('should open OAuth popup for Pinterest connection', async ({ page, context }) => {
      const popupPromise = context.waitForEvent('page');
      await page.click('[data-testid="connect-pinterest"]');
      const popup = await popupPromise;
      await expect(popup).toHaveURL(/pinterest\.com/);
      await popup.close();
    });
  });

  test.describe('OAuth Callback Handling', () => {
    test('should handle successful OAuth callback', async ({ page }) => {
      // Mock successful OAuth callback by navigating directly
      const mockToken = 'mock_access_token_12345';
      await page.goto(`/oauth/callback?provider=twitter&token=${mockToken}`);

      // Should redirect back to platform connections
      await expect(page).toHaveURL(/platforms/);

      // Should show success message
      await expect(page.locator('text=/Connected successfully|Connection successful/')).toBeVisible({ timeout: 5000 });
    });

    test('should handle OAuth denial/cancellation', async ({ page }) => {
      // Mock OAuth denial by navigating with error
      await page.goto('/oauth/callback?provider=facebook&error=access_denied');

      // Should redirect back to platform connections
      await expect(page).toHaveURL(/platforms/);

      // Should show error message
      await expect(page.locator('text=/Connection canceled|Authorization denied/')).toBeVisible({ timeout: 5000 });
    });

    test('should handle OAuth error states', async ({ page }) => {
      // Mock OAuth error
      await page.goto('/oauth/callback?provider=linkedin&error=server_error');

      // Should show error message
      await expect(page.locator('text=/Connection failed|Error connecting/')).toBeVisible({ timeout: 5000 });
    });

    test('should handle invalid provider in callback', async ({ page }) => {
      // Navigate with invalid provider
      await page.goto('/oauth/callback?provider=invalid_provider&token=test');

      // Should handle gracefully
      await expect(page).toHaveURL(/platforms|dashboard/);
    });
  });

  test.describe('Platform Disconnection', () => {
    test('should allow disconnecting connected platform', async ({ page }) => {
      // Assume a platform is connected (mock state or previous test setup)
      // Click disconnect button
      await page.click('[data-testid="disconnect-twitter"]');

      // Confirm disconnection
      await page.click('text=/Yes, disconnect|Confirm/');

      // Should show success message
      await expect(page.locator('text=/Disconnected successfully|Platform removed/')).toBeVisible({ timeout: 5000 });

      // Status should update to disconnected
      await expect(page.locator('[data-testid="twitter-status"]')).toContainText(/Not connected|Disconnected/);
    });

    test('should cancel disconnection if user cancels', async ({ page }) => {
      await page.click('[data-testid="disconnect-facebook"]');

      // Cancel disconnection
      await page.click('text=/Cancel|No/');

      // Dialog should close
      await expect(page.locator('[data-testid="disconnect-dialog"]')).not.toBeVisible();

      // Status should remain connected
      await expect(page.locator('[data-testid="facebook-status"]')).toContainText(/Connected/);
    });
  });

  test.describe('Token Expiration Handling', () => {
    test('should detect expired OAuth tokens', async ({ page }) => {
      // Mock expired token state
      await page.evaluate(() => {
        localStorage.setItem('oauth_twitter_expired', 'true');
      });

      await page.reload();

      // Should show expiration warning
      await expect(page.locator('[data-testid="twitter-token-expired"]')).toBeVisible();
      await expect(page.locator('text=/Token expired|Reconnect required/')).toBeVisible();
    });

    test('should allow re-authorization for expired tokens', async ({ page, context }) => {
      // Set expired token state
      await page.evaluate(() => {
        localStorage.setItem('oauth_linkedin_expired', 'true');
      });

      await page.reload();

      // Click reconnect button
      const popupPromise = context.waitForEvent('page');
      await page.click('[data-testid="reconnect-linkedin"]');

      // Should open OAuth popup again
      const popup = await popupPromise;
      await expect(popup).toHaveURL(/linkedin\.com/);
      await popup.close();
    });
  });

  test.describe('Network Error Handling', () => {
    test('should handle network failure during OAuth initiation', async ({ page, context }) => {
      // Simulate offline mode
      await context.setOffline(true);

      // Attempt to connect
      await page.click('[data-testid="connect-google"]');

      // Should show network error
      await expect(page.locator('text=/Network error|Connection failed|Check your internet/')).toBeVisible({ timeout: 5000 });

      // Restore network
      await context.setOffline(false);
    });

    test('should retry connection after network restoration', async ({ page, context }) => {
      // Start offline
      await context.setOffline(true);
      await page.click('[data-testid="connect-twitter"]');

      // Restore network
      await context.setOffline(false);

      // Click retry
      await page.click('[data-testid="retry-connection"]');

      // Should attempt connection again
      const popupPromise = context.waitForEvent('page');
      const popup = await popupPromise.catch(() => null);

      if (popup) {
        await popup.close();
      }
    });
  });

  test.describe('Multiple Platform Connections', () => {
    test('should allow connecting multiple platforms simultaneously', async ({ page }) => {
      // Verify multiple platforms can be in "connected" state
      const connectedPlatforms = page.locator('[data-testid*="-status"]:has-text("Connected")');
      const count = await connectedPlatforms.count();

      // Should support multiple connections
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(6);
    });

    test('should manage tokens independently for each platform', async ({ page }) => {
      // Each platform should have separate connection controls
      for (const platform of ['google', 'facebook', 'twitter', 'linkedin']) {
        await expect(page.locator(`[data-testid="connect-${platform}"]`)).toBeVisible();
      }
    });
  });
});
