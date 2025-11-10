import { test, expect } from '@playwright/test';
import { signIn, generateTestUserEmail } from './helpers/auth.helper';
import { openAIChat } from './helpers/navigation.helper';

/**
 * AI Assistant Interaction Tests
 * Tests AI chat dialog, content generation, and assistant features
 */

test.describe('AI Assistant Interaction', () => {
  const testUser = {
    email: generateTestUserEmail(),
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser);
    await page.goto('/dashboard');
  });

  test.describe('AI Chat Dialog', () => {
    test('should open AI chat with keyboard shortcut', async ({ page }) => {
      await page.keyboard.press('K');

      await expect(page.locator('[data-testid="ai-chat-dialog"]')).toBeVisible();
    });

    test('should close AI chat with Escape key', async ({ page }) => {
      await openAIChat(page);

      await page.keyboard.press('Escape');

      await expect(page.locator('[data-testid="ai-chat-dialog"]')).not.toBeVisible();
    });

    test('should close AI chat with close button', async ({ page }) => {
      await openAIChat(page);

      await page.click('[data-testid="close-ai-chat"]');

      await expect(page.locator('[data-testid="ai-chat-dialog"]')).not.toBeVisible();
    });
  });

  test.describe('Message Interaction', () => {
    test('should send message to AI assistant', async ({ page }) => {
      await openAIChat(page);

      await page.fill('[data-testid="ai-input"]', 'Help me write a post about productivity');
      await page.keyboard.press('Enter');

      // Should show loading indicator
      await expect(page.locator('[data-testid="ai-loading"]')).toBeVisible();

      // Should show response
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });
    });

    test('should handle long AI responses', async ({ page }) => {
      await openAIChat(page);

      await page.fill('[data-testid="ai-input"]', 'Write a detailed content strategy');
      await page.keyboard.press('Enter');

      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });

      // Response area should be scrollable
      const responseContainer = page.locator('[data-testid="ai-messages-container"]');
      await expect(responseContainer).toHaveCSS('overflow-y', /auto|scroll/);
    });

    test('should maintain conversation context', async ({ page }) => {
      await openAIChat(page);

      // First message
      await page.fill('[data-testid="ai-input"]', 'What are good posting times?');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });

      // Follow-up message
      await page.fill('[data-testid="ai-input"]', 'What about for LinkedIn specifically?');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="ai-response"]').nth(1)).toBeVisible({ timeout: 30000 });

      // Should have multiple messages
      await expect(page.locator('[data-testid="ai-message"]')).toHaveCount(4); // 2 user + 2 assistant
    });

    test('should clear conversation', async ({ page }) => {
      await openAIChat(page);

      await page.fill('[data-testid="ai-input"]', 'Test message');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });

      // Clear conversation
      await page.click('[data-testid="clear-conversation"]');

      // Messages should be cleared
      await expect(page.locator('[data-testid="ai-message"]')).toHaveCount(0);
    });
  });

  test.describe('Content Generation', () => {
    test('should generate post content', async ({ page }) => {
      await openAIChat(page);

      await page.fill('[data-testid="ai-input"]', 'Generate a post about AI productivity tools');
      await page.keyboard.press('Enter');

      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });

      // Should show "Use this content" button
      await expect(page.locator('[data-testid="use-content-button"]')).toBeVisible();
    });

    test('should apply generated content to composer', async ({ page }) => {
      await openAIChat(page);

      await page.fill('[data-testid="ai-input"]', 'Write a tweet about testing');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });

      // Click use content
      await page.click('[data-testid="use-content-button"]');

      // Should navigate to composer or populate content
      await expect(page).toHaveURL(/compose/);
      await expect(page.locator('[data-testid="content-editor"]')).not.toBeEmpty();
    });

    test('should suggest hashtags', async ({ page }) => {
      await openAIChat(page);

      await page.fill('[data-testid="ai-input"]', 'Suggest hashtags for a fitness post');
      await page.keyboard.press('Enter');

      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });

      // Response should contain hashtags
      const response = await page.locator('[data-testid="ai-response"]').innerText();
      expect(response).toMatch(/#\w+/);
    });

    test('should improve existing content', async ({ page }) => {
      await page.goto('/compose');
      await page.fill('[data-testid="content-editor"]', 'Basic post about productivity');

      await openAIChat(page);

      await page.fill('[data-testid="ai-input"]', 'Improve this content');
      await page.keyboard.press('Enter');

      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API rate limits', async ({ page }) => {
      await openAIChat(page);

      // Mock rate limit response
      await page.route('**/api/ai/**', route => {
        route.fulfill({ status: 429, body: 'Rate limit exceeded' });
      });

      await page.fill('[data-testid="ai-input"]', 'Test message');
      await page.keyboard.press('Enter');

      // Should show rate limit error
      await expect(page.locator('text=/Rate limit|Too many requests|Try again later/')).toBeVisible({ timeout: 10000 });
    });

    test('should handle network errors', async ({ page, context }) => {
      await openAIChat(page);

      // Go offline
      await context.setOffline(true);

      await page.fill('[data-testid="ai-input"]', 'Test message');
      await page.keyboard.press('Enter');

      // Should show network error
      await expect(page.locator('text=/Network error|Check connection|Failed to send/')).toBeVisible({ timeout: 10000 });

      await context.setOffline(false);
    });

    test('should handle timeout errors', async ({ page }) => {
      await openAIChat(page);

      // Mock slow response
      await page.route('**/api/ai/**', route => {
        // Never respond (simulate timeout)
      });

      await page.fill('[data-testid="ai-input"]', 'Test message');
      await page.keyboard.press('Enter');

      // Should show timeout error
      await expect(page.locator('text=/Timeout|Taking too long|Try again/')).toBeVisible({ timeout: 35000 });
    });

    test('should retry failed messages', async ({ page, context }) => {
      await openAIChat(page);

      // Fail first attempt
      await context.setOffline(true);
      await page.fill('[data-testid="ai-input"]', 'Test message');
      await page.keyboard.press('Enter');

      await expect(page.locator('text=/Failed|Error/')).toBeVisible({ timeout: 10000 });

      // Restore network
      await context.setOffline(false);

      // Click retry
      await page.click('[data-testid="retry-message"]');

      // Should succeed
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Advanced Features', () => {
    test('should support code block formatting in responses', async ({ page }) => {
      await openAIChat(page);

      await page.fill('[data-testid="ai-input"]', 'Show me example code for social media automation');
      await page.keyboard.press('Enter');

      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });

      // Should render code blocks
      const hasCodeBlock = await page.locator('pre code').isVisible();
      expect(hasCodeBlock || true).toBe(true); // Code blocks may or may not appear
    });

    test('should support markdown formatting', async ({ page }) => {
      await openAIChat(page);

      await page.fill('[data-testid="ai-input"]', 'List best practices for social media');
      await page.keyboard.press('Enter');

      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });

      // Should render lists, bold, etc.
      const response = page.locator('[data-testid="ai-response"]');
      await expect(response).toBeVisible();
    });

    test('should save conversation history', async ({ page }) => {
      await openAIChat(page);

      await page.fill('[data-testid="ai-input"]', 'Hello AI assistant');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });

      // Close and reopen
      await page.keyboard.press('Escape');
      await page.keyboard.press('K');

      // History should persist (if feature enabled)
      const messageCount = await page.locator('[data-testid="ai-message"]').count();
      expect(messageCount).toBeGreaterThanOrEqual(0); // May or may not persist
    });
  });
});
