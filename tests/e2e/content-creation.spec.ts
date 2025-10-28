import { test, expect } from '@playwright/test';

test.describe('Content Creation Flow', () => {
  // Gate interactive dashboard tests behind CI flag to avoid timeouts
  test.skip(!process.env.CI, 'Interactive dashboard tests only run in CI environment');

  test.beforeEach(async ({ page }) => {
    // Assume user is signed in
    await page.goto('/dashboard');
  });

  test('user can create a new post', async ({ page }) => {
    // Navigate to compose
    await page.click('text=Compose');
    
    // Select platforms
    await page.check('input[value="twitter"]');
    await page.check('input[value="instagram"]');
    
    // Write content
    await page.fill('[data-testid="content-editor"]', 'This is a test post for multiple platforms!');
    
    // Add hashtags
    await page.fill('[data-testid="hashtags-input"]', '#test #automation #pubhub');
    
    // Schedule post
    await page.click('text=Schedule');
    await page.click('[data-testid="schedule-date"]');
    await page.fill('[data-testid="schedule-time"]', '14:30');
    
    // Save draft
    await page.click('text=Save Draft');
    
    // Should show success message
    await expect(page.locator('text=Post saved as draft')).toBeVisible();
  });

  test('user can publish post immediately', async ({ page }) => {
    // Navigate to compose
    await page.click('text=Compose');
    
    // Select platform
    await page.check('input[value="twitter"]');
    
    // Write content
    await page.fill('[data-testid="content-editor"]', 'Publishing this immediately!');
    
    // Publish now
    await page.click('text=Publish Now');
    
    // Confirm publish
    await page.click('text=Confirm Publish');
    
    // Should show success message
    await expect(page.locator('text=Post published successfully')).toBeVisible();
  });

  test('user can use AI assistance for content', async ({ page }) => {
    // Navigate to compose
    await page.click('text=Compose');
    
    // Click AI assistant
    await page.click('[data-testid="ai-assistant-button"]');
    
    // Enter prompt
    await page.fill('[data-testid="ai-prompt"]', 'Write a post about productivity tips');
    
    // Generate content
    await page.click('text=Generate');
    
    // Wait for AI response
    await expect(page.locator('[data-testid="ai-generated-content"]')).toBeVisible();
    
    // Use generated content
    await page.click('text=Use This Content');
    
    // Should populate the editor
    await expect(page.locator('[data-testid="content-editor"]')).not.toBeEmpty();
  });

  test('user can remix existing content', async ({ page }) => {
    // Navigate to compose
    await page.click('text=Compose');
    
    // Click remix button
    await page.click('[data-testid="remix-button"]');
    
    // Select content to remix
    await page.click('[data-testid="content-item-1"]');
    
    // Choose remix type
    await page.click('text=Adapt for Instagram');
    
    // Confirm remix
    await page.click('text=Create Remix');
    
    // Should show remixed content
    await expect(page.locator('[data-testid="remixed-content"]')).toBeVisible();
  });
});
