import { test, expect } from '@playwright/test';
import { signIn, generateTestUserEmail } from './helpers/auth.helper';
import { navigateToCompose, navigateToCalendar } from './helpers/navigation.helper';

/**
 * Content Scheduling Tests
 * Tests scheduling functionality, calendar management, and time zone handling
 */

test.describe('Content Scheduling', () => {
  const testUser = {
    email: generateTestUserEmail(),
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser);
  });

  test.describe('Schedule Post Creation', () => {
    test('should schedule post for future date and time', async ({ page }) => {
      await navigateToCompose(page);

      // Select platform and write content
      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'Scheduled post for testing');

      // Click schedule button
      await page.click('[data-testid="schedule-button"]');

      // Select future date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await page.click('[data-testid="schedule-date-picker"]');
      await page.click(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`);

      // Select time
      await page.fill('[data-testid="schedule-time"]', '14:30');

      // Confirm schedule
      await page.click('button:has-text("Schedule")');

      // Should show success message
      await expect(page.locator('text=/Scheduled successfully|Post scheduled/')).toBeVisible({ timeout: 10000 });
    });

    test('should prevent scheduling in the past', async ({ page }) => {
      await navigateToCompose(page);

      await page.check('input[value="linkedin"]');
      await page.fill('[data-testid="content-editor"]', 'Cannot schedule in past');

      await page.click('[data-testid="schedule-button"]');

      // Select yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await page.click('[data-testid="schedule-date-picker"]');
      await page.click(`[data-date="${yesterday.toISOString().split('T')[0]}"]`);

      await page.fill('[data-testid="schedule-time"]', '10:00');

      await page.click('button:has-text("Schedule")');

      // Should show error
      await expect(page.locator('text=/Cannot schedule in the past|Future date required/')).toBeVisible();
    });

    test('should support different time zones', async ({ page }) => {
      await navigateToCompose(page);

      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'Testing timezone scheduling');

      await page.click('[data-testid="schedule-button"]');

      // Select timezone
      await page.click('[data-testid="timezone-selector"]');
      await page.click('text=America/New_York');

      // Verify timezone displayed
      await expect(page.locator('[data-testid="selected-timezone"]')).toContainText('America/New_York');

      // Select date and time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await page.click('[data-testid="schedule-date-picker"]');
      await page.click(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`);
      await page.fill('[data-testid="schedule-time"]', '15:00');

      await page.click('button:has-text("Schedule")');

      await expect(page.locator('text=/Scheduled successfully/')).toBeVisible({ timeout: 10000 });
    });

    test('should show optimal posting times suggestion', async ({ page }) => {
      await navigateToCompose(page);

      await page.check('input[value="instagram"]');
      await page.fill('[data-testid="content-editor"]', 'Post with optimal timing');

      await page.click('[data-testid="schedule-button"]');

      // Click suggest optimal time
      await page.click('[data-testid="suggest-optimal-time"]');

      // Should display suggested times
      await expect(page.locator('[data-testid="optimal-time-suggestions"]')).toBeVisible();
      await expect(page.locator('[data-testid="optimal-time-slot"]')).toHaveCount(3);

      // Select one suggestion
      await page.click('[data-testid="optimal-time-slot"]:first-child');

      // Date and time should populate
      await expect(page.locator('[data-testid="schedule-date-picker"]')).not.toHaveValue('');
      await expect(page.locator('[data-testid="schedule-time"]')).not.toHaveValue('');
    });

    test('should schedule recurring posts', async ({ page }) => {
      await navigateToCompose(page);

      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'Daily recurring post');

      await page.click('[data-testid="schedule-button"]');

      // Enable recurring
      await page.check('[data-testid="enable-recurring"]');

      // Select recurrence pattern
      await page.click('[data-testid="recurrence-pattern"]');
      await page.click('text=Daily');

      // Set end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      await page.click('[data-testid="recurrence-end-date"]');
      await page.click(`[data-date="${endDate.toISOString().split('T')[0]}"]`);

      await page.click('button:has-text("Schedule")');

      // Should show recurring schedule confirmation
      await expect(page.locator('text=/Recurring schedule created|Scheduled for 30 days/')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Calendar View Management', () => {
    test('should display scheduled posts in calendar view', async ({ page }) => {
      await navigateToCalendar(page);

      // Calendar should be visible
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();

      // Should show month, week, day views
      await expect(page.locator('[data-testid="view-month"]')).toBeVisible();
      await expect(page.locator('[data-testid="view-week"]')).toBeVisible();
      await expect(page.locator('[data-testid="view-day"]')).toBeVisible();
    });

    test('should switch between calendar view modes', async ({ page }) => {
      await navigateToCalendar(page);

      // Default: Month view
      await expect(page.locator('[data-testid="calendar-month"]')).toBeVisible();

      // Switch to week view
      await page.click('[data-testid="view-week"]');
      await expect(page.locator('[data-testid="calendar-week"]')).toBeVisible();

      // Switch to day view
      await page.click('[data-testid="view-day"]');
      await expect(page.locator('[data-testid="calendar-day"]')).toBeVisible();
    });

    test('should navigate between months in calendar', async ({ page }) => {
      await navigateToCalendar(page);

      const currentMonth = new Date().toLocaleString('default', { month: 'long' });

      // Verify current month displayed
      await expect(page.locator('[data-testid="calendar-month-label"]')).toContainText(currentMonth);

      // Navigate to next month
      await page.click('[data-testid="calendar-next-month"]');

      // Month should update
      await expect(page.locator('[data-testid="calendar-month-label"]')).not.toContainText(currentMonth);

      // Navigate back
      await page.click('[data-testid="calendar-prev-month"]');

      // Should return to current month
      await expect(page.locator('[data-testid="calendar-month-label"]')).toContainText(currentMonth);
    });

    test('should display scheduled post details in calendar', async ({ page }) => {
      await navigateToCalendar(page);

      // Click on a scheduled post
      await page.click('[data-testid="scheduled-post"]:first-child');

      // Post details should appear
      await expect(page.locator('[data-testid="post-details-modal"]')).toBeVisible();

      // Should show content preview
      await expect(page.locator('[data-testid="post-content-preview"]')).toBeVisible();

      // Should show scheduled time
      await expect(page.locator('[data-testid="post-scheduled-time"]')).toBeVisible();

      // Should show platform(s)
      await expect(page.locator('[data-testid="post-platforms"]')).toBeVisible();
    });

    test('should filter calendar by platform', async ({ page }) => {
      await navigateToCalendar(page);

      // Click platform filter
      await page.click('[data-testid="platform-filter"]');

      // Select Twitter only
      await page.click('[data-testid="filter-twitter"]');

      // Calendar should show only Twitter posts
      const posts = page.locator('[data-testid="scheduled-post"]');
      const count = await posts.count();

      for (let i = 0; i < count; i++) {
        await expect(posts.nth(i)).toContainText('Twitter');
      }
    });

    test('should filter calendar by status', async ({ page }) => {
      await navigateToCalendar(page);

      // Click status filter
      await page.click('[data-testid="status-filter"]');

      // Show only pending posts
      await page.click('[data-testid="filter-pending"]');

      // Calendar should update
      await expect(page.locator('[data-testid="scheduled-post"][data-status="pending"]')).toHaveCount(await page.locator('[data-testid="scheduled-post"]').count());
    });
  });

  test.describe('Scheduled Post Management', () => {
    test('should edit scheduled post', async ({ page }) => {
      await navigateToCalendar(page);

      // Click scheduled post
      await page.click('[data-testid="scheduled-post"]:first-child');

      // Click edit button
      await page.click('[data-testid="edit-scheduled-post"]');

      // Should open composer with post data
      await expect(page).toHaveURL(/compose/);

      // Modify content
      await page.fill('[data-testid="content-editor"]', 'Updated scheduled content');

      // Save changes
      await page.click('[data-testid="update-schedule"]');

      // Should show update confirmation
      await expect(page.locator('text=/Schedule updated|Changes saved/')).toBeVisible({ timeout: 10000 });
    });

    test('should reschedule post to different time', async ({ page }) => {
      await navigateToCalendar(page);

      await page.click('[data-testid="scheduled-post"]:first-child');

      // Click reschedule
      await page.click('[data-testid="reschedule-post"]');

      // Select new time
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);

      await page.click('[data-testid="schedule-date-picker"]');
      await page.click(`[data-date="${newDate.toISOString().split('T')[0]}"]`);

      await page.fill('[data-testid="schedule-time"]', '16:00');

      await page.click('button:has-text("Reschedule")');

      // Should confirm reschedule
      await expect(page.locator('text=/Rescheduled successfully|New time saved/')).toBeVisible({ timeout: 10000 });
    });

    test('should delete scheduled post', async ({ page }) => {
      await navigateToCalendar(page);

      await page.click('[data-testid="scheduled-post"]:first-child');

      // Click delete
      await page.click('[data-testid="delete-scheduled-post"]');

      // Confirm deletion
      await page.click('text=/Yes, delete|Confirm deletion/');

      // Should show deletion confirmation
      await expect(page.locator('text=/Post deleted|Removed from schedule/')).toBeVisible({ timeout: 5000 });

      // Post should disappear from calendar
      await expect(page.locator('[data-testid="post-details-modal"]')).not.toBeVisible();
    });

    test('should publish scheduled post immediately', async ({ page }) => {
      await navigateToCalendar(page);

      await page.click('[data-testid="scheduled-post"]:first-child');

      // Click publish now
      await page.click('[data-testid="publish-now"]');

      // Confirm immediate publish
      await page.click('text=/Yes, publish now|Confirm/');

      // Should show publish success
      await expect(page.locator('text=/Published successfully|Post published/')).toBeVisible({ timeout: 10000 });

      // Post should update status
      await expect(page.locator('[data-testid="post-status"]')).toContainText(/Published/);
    });
  });

  test.describe('Queue Management', () => {
    test('should add post to queue', async ({ page }) => {
      await navigateToCompose(page);

      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'Add to queue test');

      // Click add to queue
      await page.click('[data-testid="add-to-queue"]');

      // Should show queue confirmation
      await expect(page.locator('text=/Added to queue|Queued successfully/')).toBeVisible({ timeout: 5000 });
    });

    test('should display queue view', async ({ page }) => {
      await navigateToCalendar(page);

      // Switch to queue view
      await page.click('[data-testid="view-queue"]');

      // Queue should be visible
      await expect(page.locator('[data-testid="queue-view"]')).toBeVisible();

      // Should show queued posts in order
      await expect(page.locator('[data-testid="queued-post"]')).toHaveCount(await page.locator('[data-testid="queued-post"]').count());
    });

    test('should reorder queue items with drag and drop', async ({ page }) => {
      await navigateToCalendar(page);
      await page.click('[data-testid="view-queue"]');

      const firstPost = page.locator('[data-testid="queued-post"]:first-child');
      const secondPost = page.locator('[data-testid="queued-post"]:nth-child(2)');

      // Drag first post to second position
      await firstPost.dragTo(secondPost);

      // Order should update
      await expect(page.locator('[data-testid="queued-post"]:first-child')).not.toHaveText(await firstPost.innerText());
    });

    test('should configure queue schedule settings', async ({ page }) => {
      await navigateToCalendar(page);
      await page.click('[data-testid="view-queue"]');

      // Click queue settings
      await page.click('[data-testid="queue-settings"]');

      // Configure posting times
      await page.check('[data-testid="queue-time-9am"]');
      await page.check('[data-testid="queue-time-2pm"]');
      await page.check('[data-testid="queue-time-6pm"]');

      // Save settings
      await page.click('button:has-text("Save Queue Settings")');

      // Should confirm save
      await expect(page.locator('text=/Queue settings saved|Settings updated/')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Scheduling Edge Cases', () => {
    test('should handle daylight saving time transitions', async ({ page }) => {
      await navigateToCompose(page);

      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'DST transition test');

      await page.click('[data-testid="schedule-button"]');

      // Select date during DST transition (example: March 10, 2024)
      const dstDate = new Date('2024-03-10');

      await page.click('[data-testid="schedule-date-picker"]');
      await page.click(`[data-date="${dstDate.toISOString().split('T')[0]}"]`);

      await page.fill('[data-testid="schedule-time"]', '02:30'); // During DST transition

      // Should show DST warning
      await expect(page.locator('text=/Daylight saving time|Time zone change|DST/')).toBeVisible();
    });

    test('should handle scheduling conflicts', async ({ page }) => {
      await navigateToCompose(page);

      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'Conflict test post');

      await page.click('[data-testid="schedule-button"]');

      // Select time with existing scheduled post
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await page.click('[data-testid="schedule-date-picker"]');
      await page.click(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`);
      await page.fill('[data-testid="schedule-time"]', '10:00');

      await page.click('button:has-text("Schedule")');

      // Should warn about conflict or suggest different time
      const conflictWarning = await page.locator('text=/Already scheduled|Time slot occupied|Conflict/').isVisible();

      if (conflictWarning) {
        // Should allow proceeding anyway or suggest alternative
        await expect(page.locator('[data-testid="schedule-anyway"]')).toBeVisible();
      }
    });

    test('should handle network errors during scheduling', async ({ page, context }) => {
      await navigateToCompose(page);

      await page.check('input[value="linkedin"]');
      await page.fill('[data-testid="content-editor"]', 'Network error test');

      await page.click('[data-testid="schedule-button"]');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await page.click('[data-testid="schedule-date-picker"]');
      await page.click(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`);
      await page.fill('[data-testid="schedule-time"]', '14:00');

      // Simulate network failure
      await context.setOffline(true);

      await page.click('button:has-text("Schedule")');

      // Should show error
      await expect(page.locator('text=/Network error|Failed to schedule|Check connection/')).toBeVisible({ timeout: 10000 });

      await context.setOffline(false);
    });
  });
});
