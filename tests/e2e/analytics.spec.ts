import { test, expect } from '@playwright/test';
import { signIn, generateTestUserEmail } from './helpers/auth.helper';
import { navigateToAnalytics } from './helpers/navigation.helper';

/**
 * Analytics Viewing Tests
 * Tests analytics dashboard, metrics display, and data filtering
 */

test.describe('Analytics Viewing', () => {
  const testUser = {
    email: generateTestUserEmail(),
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser);
    await navigateToAnalytics(page);
  });

  test.describe('Dashboard Display', () => {
    test('should display analytics dashboard', async ({ page }) => {
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      await expect(page.locator('text=/Analytics|Performance|Insights/')).toBeVisible();
    });

    test('should show key metrics overview', async ({ page }) => {
      const metrics = ['total-posts', 'total-engagement', 'follower-growth', 'reach'];

      for (const metric of metrics) {
        await expect(page.locator(`[data-testid="${metric}"]`)).toBeVisible();
      }
    });

    test('should display engagement chart', async ({ page }) => {
      await expect(page.locator('[data-testid="engagement-chart"]')).toBeVisible();
    });

    test('should display follower growth chart', async ({ page }) => {
      await expect(page.locator('[data-testid="follower-chart"]')).toBeVisible();
    });
  });

  test.describe('Date Range Filtering', () => {
    test('should filter by last 7 days', async ({ page }) => {
      await page.click('[data-testid="date-range-filter"]');
      await page.click('text=Last 7 days');
      await expect(page.locator('[data-testid="selected-range"]')).toContainText('7 days');
    });

    test('should filter by last 30 days', async ({ page }) => {
      await page.click('[data-testid="date-range-filter"]');
      await page.click('text=Last 30 days');
      await expect(page.locator('[data-testid="selected-range"]')).toContainText('30 days');
    });

    test('should allow custom date range selection', async ({ page }) => {
      await page.click('[data-testid="date-range-filter"]');
      await page.click('text=Custom range');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);

      const endDate = new Date();

      await page.fill('[data-testid="start-date"]', startDate.toISOString().split('T')[0]);
      await page.fill('[data-testid="end-date"]', endDate.toISOString().split('T')[0]);

      await page.click('button:has-text("Apply")');
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
    });
  });

  test.describe('Platform Filtering', () => {
    test('should filter analytics by platform', async ({ page }) => {
      await page.click('[data-testid="platform-filter"]');
      await page.click('[data-testid="filter-twitter"]');

      await expect(page.locator('[data-testid="analytics-platform"]')).toContainText('Twitter');
    });

    test('should show all platforms by default', async ({ page }) => {
      await expect(page.locator('[data-testid="all-platforms-view"]')).toBeVisible();
    });
  });

  test.describe('Metric Details', () => {
    test('should show detailed engagement metrics', async ({ page }) => {
      await page.click('[data-testid="total-engagement"]');

      await expect(page.locator('[data-testid="likes-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="comments-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="shares-count"]')).toBeVisible();
    });

    test('should export analytics data', async ({ page }) => {
      await page.click('[data-testid="export-analytics"]');
      await page.click('text=Export as CSV');

      // Wait for download
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain('.csv');
    });
  });
});
