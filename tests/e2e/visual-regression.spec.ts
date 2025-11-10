import { test, expect } from '@playwright/test';
import { signIn, generateTestUserEmail } from './helpers/auth.helper';

/**
 * Visual Regression Tests
 * Tests visual consistency across key pages and responsive designs
 */

test.describe('Visual Regression', () => {
  const testUser = {
    email: generateTestUserEmail(),
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser);
  });

  test.describe('Key Pages Screenshots', () => {
    test('should match dashboard visual snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match composer visual snapshot', async ({ page }) => {
      await page.goto('/compose');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('composer.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match calendar visual snapshot', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('calendar.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match inbox visual snapshot', async ({ page }) => {
      await page.goto('/inbox');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('inbox.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match analytics visual snapshot', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('analytics.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match settings visual snapshot', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('settings.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Responsive Design', () => {
    test('should match mobile viewport (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match tablet viewport (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match desktop viewport (1280px)', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-desktop.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match ultra-wide viewport (1920px)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-ultrawide.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Theme Visual Tests', () => {
    test('should match light theme visually', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Appearance');
      await page.click('[data-testid="theme-light"]');

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-light.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match dark theme visually', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Appearance');
      await page.click('[data-testid="theme-dark"]');

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-dark.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should have no visual regressions during theme switch', async ({ page }) => {
      await page.goto('/dashboard');

      // Light theme screenshot
      await expect(page).toHaveScreenshot('before-theme-switch.png', {
        animations: 'disabled',
      });

      // Switch to dark
      await page.emulateMedia({ colorScheme: 'dark' });

      // Dark theme screenshot
      await expect(page).toHaveScreenshot('after-theme-switch.png', {
        animations: 'disabled',
      });
    });
  });

  test.describe('Component Visual Tests', () => {
    test('should match composer with content', async ({ page }) => {
      await page.goto('/compose');

      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'Sample post content for visual testing');

      await expect(page).toHaveScreenshot('composer-with-content.png', {
        animations: 'disabled',
      });
    });

    test('should match calendar with scheduled posts', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      // Navigate to specific month to have consistent data
      await page.click('[data-testid="calendar-next-month"]');

      await expect(page).toHaveScreenshot('calendar-with-posts.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match modals and dialogs', async ({ page }) => {
      await page.goto('/dashboard');

      // Open AI chat dialog
      await page.keyboard.press('K');

      await expect(page).toHaveScreenshot('ai-chat-dialog.png', {
        animations: 'disabled',
      });
    });

    test('should match empty states', async ({ page }) => {
      await page.goto('/inbox');

      // Filter to create empty state
      await page.click('[data-testid="filter-platform"]');
      await page.click('[data-testid="filter-option-youtube"]');

      await expect(page).toHaveScreenshot('inbox-empty-state.png', {
        animations: 'disabled',
      });
    });
  });

  test.describe('Cross-Browser Visual Consistency', () => {
    test('should match visual appearance in Chromium', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chromium-specific test');

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-chromium.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match visual appearance in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-firefox.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match visual appearance in WebKit', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'WebKit-specific test');

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-webkit.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Animation and Transition Tests', () => {
    test('should have smooth page transitions', async ({ page }) => {
      await page.goto('/dashboard');

      // Capture before navigation
      await expect(page).toHaveScreenshot('before-navigation.png', {
        animations: 'disabled',
      });

      // Navigate to composer
      await page.click('text=Compose');
      await page.waitForLoadState('networkidle');

      // Capture after navigation
      await expect(page).toHaveScreenshot('after-navigation.png', {
        animations: 'disabled',
      });
    });

    test('should render loading states consistently', async ({ page }) => {
      await page.goto('/dashboard');

      // Mock slow API to capture loading state
      await page.route('**/api/dashboard', async route => {
        await page.waitForTimeout(1000);
        await route.continue();
      });

      await page.reload();

      // Capture loading state
      await expect(page.locator('[data-testid="loading-state"]')).toBeVisible();
      await expect(page).toHaveScreenshot('loading-state.png', {
        animations: 'disabled',
      });
    });
  });

  test.describe('Accessibility Visual Tests', () => {
    test('should maintain focus indicators visually', async ({ page }) => {
      await page.goto('/dashboard');

      // Tab to first focusable element
      await page.keyboard.press('Tab');

      await expect(page).toHaveScreenshot('focus-indicator.png', {
        animations: 'disabled',
      });
    });

    test('should have high contrast mode visuals', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('high-contrast-mode.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });
});
