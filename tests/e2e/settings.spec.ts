import { test, expect } from '@playwright/test';
import { signIn, generateTestUserEmail } from './helpers/auth.helper';
import { navigateToSettings } from './helpers/navigation.helper';

/**
 * Settings Management Tests
 * Tests user settings, preferences, and account management
 */

test.describe('Settings Management', () => {
  const testUser = {
    email: generateTestUserEmail(),
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser);
    await navigateToSettings(page);
  });

  test.describe('Profile Settings', () => {
    test('should update profile information', async ({ page }) => {
      await page.click('text=Profile');

      await page.fill('[data-testid="profile-name"]', 'Updated Name');
      await page.fill('[data-testid="profile-bio"]', 'Updated bio');

      await page.click('button:has-text("Save")');

      await expect(page.locator('text=/Saved successfully|Profile updated/')).toBeVisible({ timeout: 5000 });
    });

    test('should upload profile picture', async ({ page }) => {
      await page.click('text=Profile');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'avatar.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-avatar'),
      });

      await expect(page.locator('[data-testid="avatar-preview"]')).toBeVisible();
    });

    test('should change password', async ({ page }) => {
      await page.click('text=Security');

      await page.fill('[data-testid="current-password"]', testUser.password);
      await page.fill('[data-testid="new-password"]', 'NewPassword123!');
      await page.fill('[data-testid="confirm-new-password"]', 'NewPassword123!');

      await page.click('button:has-text("Update Password")');

      await expect(page.locator('text=/Password updated|Password changed/')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Theme Settings', () => {
    test('should switch to dark mode', async ({ page }) => {
      await page.click('text=Appearance');
      await page.click('[data-testid="theme-dark"]');

      await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
    });

    test('should switch to light mode', async ({ page }) => {
      await page.click('text=Appearance');
      await page.click('[data-testid="theme-light"]');

      await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
    });

    test('should use system theme', async ({ page }) => {
      await page.click('text=Appearance');
      await page.click('[data-testid="theme-system"]');

      await expect(page.locator('[data-testid="theme-system"]')).toBeChecked();
    });
  });

  test.describe('Notification Settings', () => {
    test('should toggle email notifications', async ({ page }) => {
      await page.click('text=Notifications');

      await page.check('[data-testid="email-notifications"]');
      await page.click('button:has-text("Save")');

      await expect(page.locator('text=/Settings saved/')).toBeVisible({ timeout: 5000 });
    });

    test('should configure notification types', async ({ page }) => {
      await page.click('text=Notifications');

      await page.check('[data-testid="notify-mentions"]');
      await page.check('[data-testid="notify-comments"]');
      await page.uncheck('[data-testid="notify-likes"]');

      await page.click('button:has-text("Save")');

      await expect(page.locator('text=/Settings saved/')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Account Management', () => {
    test('should view account plan', async ({ page }) => {
      await page.click('text=Account');

      await expect(page.locator('[data-testid="current-plan"]')).toBeVisible();
    });

    test('should delete account with confirmation', async ({ page }) => {
      await page.click('text=Account');

      await page.click('[data-testid="delete-account"]');

      await expect(page.locator('text=/Are you sure|Delete account|This action cannot be undone/')).toBeVisible();

      // Cancel deletion (don't actually delete)
      await page.click('text=Cancel');

      await expect(page.locator('[data-testid="delete-account-dialog"]')).not.toBeVisible();
    });
  });
});
