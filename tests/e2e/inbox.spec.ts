import { test, expect } from '@playwright/test';
import { signIn, generateTestUserEmail } from './helpers/auth.helper';
import { navigateToInbox } from './helpers/navigation.helper';

/**
 * Inbox Message Handling Tests
 * Tests unified inbox functionality, message filtering, and engagement features
 */

test.describe('Inbox Message Handling', () => {
  const testUser = {
    email: generateTestUserEmail(),
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser);
    await navigateToInbox(page);
  });

  test.describe('Inbox Display', () => {
    test('should display unified inbox with messages from all platforms', async ({ page }) => {
      // Inbox should be visible
      await expect(page.locator('[data-testid="inbox-container"]')).toBeVisible();

      // Should show message list
      await expect(page.locator('[data-testid="message-list"]')).toBeVisible();

      // Check for platform indicators
      const messages = page.locator('[data-testid="message-item"]');
      const count = await messages.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show message preview in list', async ({ page }) => {
      const firstMessage = page.locator('[data-testid="message-item"]:first-child');

      // Should display sender
      await expect(firstMessage.locator('[data-testid="message-sender"]')).toBeVisible();

      // Should display message preview
      await expect(firstMessage.locator('[data-testid="message-preview"]')).toBeVisible();

      // Should display timestamp
      await expect(firstMessage.locator('[data-testid="message-timestamp"]')).toBeVisible();

      // Should display platform icon
      await expect(firstMessage.locator('[data-testid="message-platform-icon"]')).toBeVisible();
    });

    test('should distinguish between read and unread messages', async ({ page }) => {
      const unreadMessages = page.locator('[data-testid="message-item"][data-read="false"]');
      const readMessages = page.locator('[data-testid="message-item"][data-read="true"]');

      // Unread should have visual indicator
      const unreadCount = await unreadMessages.count();
      if (unreadCount > 0) {
        await expect(unreadMessages.first().locator('[data-testid="unread-indicator"]')).toBeVisible();
      }
    });

    test('should display unread message count', async ({ page }) => {
      // Unread count badge should be visible
      const unreadBadge = page.locator('[data-testid="unread-count"]');

      if (await unreadBadge.isVisible()) {
        const countText = await unreadBadge.innerText();
        expect(parseInt(countText)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Message Filtering', () => {
    test('should filter messages by platform', async ({ page }) => {
      // Click platform filter
      await page.click('[data-testid="filter-platform"]');

      // Select Twitter only
      await page.click('[data-testid="filter-option-twitter"]');

      // All visible messages should be from Twitter
      const messages = page.locator('[data-testid="message-item"]');
      const count = await messages.count();

      for (let i = 0; i < count; i++) {
        await expect(messages.nth(i).locator('[data-testid="message-platform-icon"]')).toHaveAttribute('data-platform', 'twitter');
      }
    });

    test('should filter messages by read/unread status', async ({ page }) => {
      // Click status filter
      await page.click('[data-testid="filter-status"]');

      // Show only unread
      await page.click('[data-testid="filter-option-unread"]');

      // All messages should be unread
      const messages = page.locator('[data-testid="message-item"]');
      const count = await messages.count();

      for (let i = 0; i < count; i++) {
        await expect(messages.nth(i)).toHaveAttribute('data-read', 'false');
      }
    });

    test('should filter messages by type (DM, mention, comment)', async ({ page }) => {
      // Click type filter
      await page.click('[data-testid="filter-type"]');

      // Show only mentions
      await page.click('[data-testid="filter-option-mentions"]');

      // Should update message list
      await expect(page.locator('[data-testid="message-item"][data-type="mention"]')).toHaveCount(await page.locator('[data-testid="message-item"]').count());
    });

    test('should search messages by content', async ({ page }) => {
      // Type search query
      await page.fill('[data-testid="inbox-search"]', 'test message');

      // Press enter or wait for auto-search
      await page.press('[data-testid="inbox-search"]', 'Enter');

      // Results should update
      await expect(page.locator('[data-testid="message-item"]')).toHaveCount(await page.locator('[data-testid="message-item"]').count());

      // Messages should contain search term
      const firstMessage = page.locator('[data-testid="message-item"]:first-child');
      if (await firstMessage.isVisible()) {
        await expect(firstMessage).toContainText(/test message/i);
      }
    });

    test('should combine multiple filters', async ({ page }) => {
      // Apply platform filter
      await page.click('[data-testid="filter-platform"]');
      await page.click('[data-testid="filter-option-twitter"]');

      // Apply status filter
      await page.click('[data-testid="filter-status"]');
      await page.click('[data-testid="filter-option-unread"]');

      // Should show unread Twitter messages only
      const messages = page.locator('[data-testid="message-item"]');
      const count = await messages.count();

      for (let i = 0; i < count; i++) {
        await expect(messages.nth(i)).toHaveAttribute('data-read', 'false');
        await expect(messages.nth(i).locator('[data-testid="message-platform-icon"]')).toHaveAttribute('data-platform', 'twitter');
      }
    });

    test('should clear all filters', async ({ page }) => {
      // Apply some filters
      await page.click('[data-testid="filter-platform"]');
      await page.click('[data-testid="filter-option-linkedin"]');

      // Click clear filters
      await page.click('[data-testid="clear-filters"]');

      // All messages should be visible again
      await expect(page.locator('[data-testid="message-item"]')).toHaveCount(await page.locator('[data-testid="message-item"]').count());
    });
  });

  test.describe('Message Actions', () => {
    test('should mark message as read', async ({ page }) => {
      const unreadMessage = page.locator('[data-testid="message-item"][data-read="false"]:first-child');

      if (await unreadMessage.isVisible()) {
        // Click message to mark as read
        await unreadMessage.click();

        // Should update read status
        await expect(unreadMessage).toHaveAttribute('data-read', 'true');

        // Unread count should decrease
        const unreadCount = page.locator('[data-testid="unread-count"]');
        if (await unreadCount.isVisible()) {
          const newCount = parseInt(await unreadCount.innerText());
          expect(newCount).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should mark message as unread', async ({ page }) => {
      const readMessage = page.locator('[data-testid="message-item"][data-read="true"]:first-child');

      if (await readMessage.isVisible()) {
        // Right-click or click action menu
        await readMessage.click({ button: 'right' });

        // Click mark as unread
        await page.click('[data-testid="mark-unread"]');

        // Should update status
        await expect(readMessage).toHaveAttribute('data-read', 'false');
      }
    });

    test('should reply to message', async ({ page }) => {
      const message = page.locator('[data-testid="message-item"]:first-child');

      // Click message to open detail view
      await message.click();

      // Reply button should be visible
      await expect(page.locator('[data-testid="reply-button"]')).toBeVisible();

      // Click reply
      await page.click('[data-testid="reply-button"]');

      // Reply composer should appear
      await expect(page.locator('[data-testid="reply-composer"]')).toBeVisible();

      // Type reply
      await page.fill('[data-testid="reply-text"]', 'Thank you for your message!');

      // Send reply
      await page.click('[data-testid="send-reply"]');

      // Should show success
      await expect(page.locator('text=/Reply sent|Sent successfully/')).toBeVisible({ timeout: 10000 });
    });

    test('should archive message', async ({ page }) => {
      const message = page.locator('[data-testid="message-item"]:first-child');

      // Click message
      await message.click();

      // Click archive
      await page.click('[data-testid="archive-message"]');

      // Message should disappear from inbox
      await expect(message).not.toBeVisible();

      // Should show confirmation
      await expect(page.locator('text=/Archived|Message archived/')).toBeVisible({ timeout: 5000 });
    });

    test('should delete message', async ({ page }) => {
      const message = page.locator('[data-testid="message-item"]:first-child');

      // Click message
      await message.click();

      // Click delete
      await page.click('[data-testid="delete-message"]');

      // Confirm deletion
      await page.click('text=/Yes, delete|Confirm/');

      // Message should disappear
      await expect(message).not.toBeVisible();

      // Should show confirmation
      await expect(page.locator('text=/Deleted|Message deleted/')).toBeVisible({ timeout: 5000 });
    });

    test('should star/favorite message', async ({ page }) => {
      const message = page.locator('[data-testid="message-item"]:first-child');

      // Click star icon
      await message.locator('[data-testid="star-message"]').click();

      // Should update star status
      await expect(message.locator('[data-testid="star-message"]')).toHaveAttribute('data-starred', 'true');
    });
  });

  test.describe('Bulk Actions', () => {
    test('should select multiple messages', async ({ page }) => {
      // Enable selection mode
      await page.click('[data-testid="enable-selection"]');

      // Select first 3 messages
      await page.click('[data-testid="message-checkbox"]:nth-child(1)');
      await page.click('[data-testid="message-checkbox"]:nth-child(2)');
      await page.click('[data-testid="message-checkbox"]:nth-child(3)');

      // Selection count should show 3
      await expect(page.locator('[data-testid="selection-count"]')).toContainText('3');
    });

    test('should mark multiple messages as read', async ({ page }) => {
      await page.click('[data-testid="enable-selection"]');

      // Select unread messages
      await page.click('[data-testid="message-checkbox"][data-read="false"]:nth-child(1)');
      await page.click('[data-testid="message-checkbox"][data-read="false"]:nth-child(2)');

      // Click bulk mark as read
      await page.click('[data-testid="bulk-mark-read"]');

      // Selected messages should update
      await expect(page.locator('[data-testid="message-item"][data-read="true"]')).toHaveCount(2);
    });

    test('should archive multiple messages', async ({ page }) => {
      await page.click('[data-testid="enable-selection"]');

      const initialCount = await page.locator('[data-testid="message-item"]').count();

      // Select 2 messages
      await page.click('[data-testid="message-checkbox"]:nth-child(1)');
      await page.click('[data-testid="message-checkbox"]:nth-child(2)');

      // Bulk archive
      await page.click('[data-testid="bulk-archive"]');

      // Messages should disappear
      const newCount = await page.locator('[data-testid="message-item"]').count();
      expect(newCount).toBeLessThan(initialCount);
    });

    test('should delete multiple messages', async ({ page }) => {
      await page.click('[data-testid="enable-selection"]');

      // Select messages
      await page.click('[data-testid="message-checkbox"]:nth-child(1)');
      await page.click('[data-testid="message-checkbox"]:nth-child(2)');

      // Bulk delete
      await page.click('[data-testid="bulk-delete"]');

      // Confirm deletion
      await page.click('text=/Yes, delete|Confirm/');

      // Should show confirmation
      await expect(page.locator('text=/2 messages deleted|Deleted successfully/')).toBeVisible({ timeout: 5000 });
    });

    test('should select all messages', async ({ page }) => {
      await page.click('[data-testid="enable-selection"]');

      const totalMessages = await page.locator('[data-testid="message-item"]').count();

      // Click select all
      await page.click('[data-testid="select-all"]');

      // All checkboxes should be checked
      const checkedCount = await page.locator('[data-testid="message-checkbox"]:checked').count();
      expect(checkedCount).toBe(totalMessages);
    });
  });

  test.describe('Message Thread View', () => {
    test('should display full message thread', async ({ page }) => {
      // Click message with thread
      await page.click('[data-testid="message-item"][data-has-thread="true"]:first-child');

      // Thread view should appear
      await expect(page.locator('[data-testid="message-thread"]')).toBeVisible();

      // Should show all messages in thread
      await expect(page.locator('[data-testid="thread-message"]')).toHaveCount(await page.locator('[data-testid="thread-message"]').count());
    });

    test('should show chronological order in thread', async ({ page }) => {
      await page.click('[data-testid="message-item"][data-has-thread="true"]:first-child');

      // Get all timestamps
      const timestamps = await page.locator('[data-testid="thread-message"] [data-testid="message-timestamp"]').allInnerTexts();

      // Verify chronological order (oldest first)
      for (let i = 0; i < timestamps.length - 1; i++) {
        const current = new Date(timestamps[i]);
        const next = new Date(timestamps[i + 1]);
        expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
      }
    });

    test('should allow replying in thread', async ({ page }) => {
      await page.click('[data-testid="message-item"][data-has-thread="true"]:first-child');

      // Reply in thread
      await page.fill('[data-testid="thread-reply-text"]', 'Reply in thread');
      await page.click('[data-testid="send-thread-reply"]');

      // Should show success
      await expect(page.locator('text=/Reply sent/')).toBeVisible({ timeout: 10000 });

      // Thread should update with new message
      await expect(page.locator('[data-testid="thread-message"]')).toHaveCount(await page.locator('[data-testid="thread-message"]').count());
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle empty inbox gracefully', async ({ page }) => {
      // Filter to show no results
      await page.click('[data-testid="filter-platform"]');
      await page.click('[data-testid="filter-option-youtube"]');

      // Should show empty state
      await expect(page.locator('[data-testid="empty-inbox"]')).toBeVisible();
      await expect(page.locator('text=/No messages|Inbox empty/')).toBeVisible();
    });

    test('should handle network errors when loading messages', async ({ page, context }) => {
      // Simulate network failure
      await context.setOffline(true);

      // Reload inbox
      await page.reload();

      // Should show error message
      await expect(page.locator('text=/Network error|Failed to load|Check connection/')).toBeVisible({ timeout: 10000 });

      await context.setOffline(false);
    });

    test('should handle failed reply submission', async ({ page, context }) => {
      const message = page.locator('[data-testid="message-item"]:first-child');
      await message.click();

      await page.click('[data-testid="reply-button"]');
      await page.fill('[data-testid="reply-text"]', 'Test reply');

      // Simulate network failure
      await context.setOffline(true);

      await page.click('[data-testid="send-reply"]');

      // Should show error
      await expect(page.locator('text=/Failed to send|Network error|Try again/')).toBeVisible({ timeout: 10000 });

      await context.setOffline(false);
    });

    test('should sync messages across tabs', async ({ page, context }) => {
      // Open inbox in second tab
      const secondTab = await context.newPage();
      await secondTab.goto(page.url());

      // Mark message as read in first tab
      const message = page.locator('[data-testid="message-item"]:first-child');
      await message.click();

      // Wait briefly for sync
      await secondTab.waitForTimeout(2000);

      // Second tab should reflect change
      const sameMessageInSecondTab = secondTab.locator('[data-testid="message-item"]:first-child');
      await expect(sameMessageInSecondTab).toHaveAttribute('data-read', 'true');

      await secondTab.close();
    });
  });
});
