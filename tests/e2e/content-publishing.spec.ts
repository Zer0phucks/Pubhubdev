import { test, expect } from '@playwright/test';
import { signIn, generateTestUserEmail } from './helpers/auth.helper';
import { navigateToCompose } from './helpers/navigation.helper';

/**
 * Content Creation and Publishing Tests
 * Tests core content creation, multi-platform publishing, and media handling
 */

test.describe('Content Creation and Publishing', () => {
  const testUser = {
    email: generateTestUserEmail(),
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser);
    await navigateToCompose(page);
  });

  test.describe('Platform Selection', () => {
    test('should display all supported platforms', async ({ page }) => {
      const platforms = ['Twitter', 'Instagram', 'LinkedIn', 'Facebook', 'YouTube', 'TikTok', 'Pinterest', 'Reddit'];

      for (const platform of platforms) {
        await expect(page.locator(`[data-testid="platform-${platform.toLowerCase()}"]`)).toBeVisible();
      }
    });

    test('should allow selecting multiple platforms', async ({ page }) => {
      await page.check('input[value="twitter"]');
      await page.check('input[value="instagram"]');
      await page.check('input[value="linkedin"]');

      // Verify all selected
      await expect(page.locator('input[value="twitter"]')).toBeChecked();
      await expect(page.locator('input[value="instagram"]')).toBeChecked();
      await expect(page.locator('input[value="linkedin"]')).toBeChecked();
    });

    test('should show platform-specific character limits', async ({ page }) => {
      await page.check('input[value="twitter"]');
      await expect(page.locator('[data-testid="character-limit-twitter"]')).toContainText('280');

      await page.check('input[value="linkedin"]');
      await expect(page.locator('[data-testid="character-limit-linkedin"]')).toContainText('3000');
    });

    test('should warn when character limit exceeded', async ({ page }) => {
      await page.check('input[value="twitter"]');

      // Type content exceeding Twitter limit (280 chars)
      const longContent = 'a'.repeat(300);
      await page.fill('[data-testid="content-editor"]', longContent);

      // Should show warning
      await expect(page.locator('[data-testid="character-limit-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="character-limit-warning"]')).toContainText(/exceeded|over limit/);
    });

    test('should disable platforms that are not connected', async ({ page }) => {
      // Platforms not connected should be disabled or show connect prompt
      const disconnectedPlatform = page.locator('[data-testid="platform-youtube"][data-connected="false"]');

      if (await disconnectedPlatform.isVisible()) {
        await expect(disconnectedPlatform).toBeDisabled();
      }
    });
  });

  test.describe('Content Creation', () => {
    test('should allow writing post content', async ({ page }) => {
      const content = 'This is a test post for PubHub E2E testing!';

      await page.fill('[data-testid="content-editor"]', content);

      await expect(page.locator('[data-testid="content-editor"]')).toHaveValue(content);
    });

    test('should support rich text formatting', async ({ page }) => {
      await page.click('[data-testid="bold-button"]');
      await page.fill('[data-testid="content-editor"]', 'Bold text');

      await expect(page.locator('[data-testid="content-editor"]')).toContainText('Bold text');
    });

    test('should allow adding hashtags', async ({ page }) => {
      await page.fill('[data-testid="hashtags-input"]', '#testing #automation #pubhub');

      await expect(page.locator('[data-testid="hashtag-tag"]')).toHaveCount(3);
    });

    test('should validate hashtag format', async ({ page }) => {
      // Invalid hashtag (with space)
      await page.fill('[data-testid="hashtags-input"]', '#invalid hashtag');
      await page.press('[data-testid="hashtags-input"]', 'Enter');

      // Should show validation error
      await expect(page.locator('text=/Invalid hashtag|Hashtag format/')).toBeVisible();
    });

    test('should support mentions/tagging', async ({ page }) => {
      await page.fill('[data-testid="content-editor"]', 'Hey @user this is a test!');

      // Mention autocomplete should appear
      await expect(page.locator('[data-testid="mention-autocomplete"]')).toBeVisible();
    });

    test('should allow adding emojis', async ({ page }) => {
      await page.click('[data-testid="emoji-picker-button"]');
      await expect(page.locator('[data-testid="emoji-picker"]')).toBeVisible();

      await page.click('[data-testid="emoji-😀"]');
      await expect(page.locator('[data-testid="content-editor"]')).toContainText('😀');
    });
  });

  test.describe('Media Handling', () => {
    test('should allow uploading images', async ({ page }) => {
      // Click upload button
      await page.click('[data-testid="upload-media-button"]');

      // Select file (mock file upload)
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
      });

      // Should show uploaded image preview
      await expect(page.locator('[data-testid="media-preview"]')).toBeVisible();
    });

    test('should validate image file size', async ({ page }) => {
      await page.click('[data-testid="upload-media-button"]');

      // Mock large file (>10MB)
      const fileInput = page.locator('input[type="file"]');
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      await fileInput.setInputFiles({
        name: 'large-image.jpg',
        mimeType: 'image/jpeg',
        buffer: largeBuffer,
      });

      // Should show size error
      await expect(page.locator('text=/File too large|Size limit exceeded/')).toBeVisible();
    });

    test('should validate image file type', async ({ page }) => {
      await page.click('[data-testid="upload-media-button"]');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'invalid-file.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('not-an-image'),
      });

      // Should show type error
      await expect(page.locator('text=/Invalid file type|Unsupported format/')).toBeVisible();
    });

    test('should allow uploading multiple images', async ({ page }) => {
      await page.click('[data-testid="upload-media-button"]');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([
        { name: 'image1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('image1') },
        { name: 'image2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('image2') },
        { name: 'image3.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('image3') },
      ]);

      // Should show 3 previews
      await expect(page.locator('[data-testid="media-preview"]')).toHaveCount(3);
    });

    test('should allow removing uploaded media', async ({ page }) => {
      await page.click('[data-testid="upload-media-button"]');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image'),
      });

      // Remove media
      await page.click('[data-testid="remove-media-0"]');

      // Preview should be removed
      await expect(page.locator('[data-testid="media-preview"]')).toHaveCount(0);
    });

    test('should support video uploads', async ({ page }) => {
      await page.click('[data-testid="upload-media-button"]');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-video.mp4',
        mimeType: 'video/mp4',
        buffer: Buffer.from('fake-video-data'),
      });

      // Should show video preview
      await expect(page.locator('[data-testid="video-preview"]')).toBeVisible();
    });
  });

  test.describe('Immediate Publishing', () => {
    test('should publish post immediately to single platform', async ({ page }) => {
      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'Publishing this test post immediately!');

      await page.click('[data-testid="publish-now-button"]');

      // Confirm publish
      await page.click('text=/Confirm|Yes, publish/');

      // Should show success message
      await expect(page.locator('text=/Published successfully|Post published/')).toBeVisible({ timeout: 10000 });
    });

    test('should publish post to multiple platforms simultaneously', async ({ page }) => {
      await page.check('input[value="twitter"]');
      await page.check('input[value="linkedin"]');
      await page.fill('[data-testid="content-editor"]', 'Cross-posting to multiple platforms!');

      await page.click('[data-testid="publish-now-button"]');
      await page.click('text=/Confirm|Yes, publish/');

      // Should show success for both platforms
      await expect(page.locator('text=/Published to 2 platforms|All platforms published/')).toBeVisible({ timeout: 10000 });
    });

    test('should handle publish failure gracefully', async ({ page, context }) => {
      // Simulate network failure
      await context.setOffline(true);

      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'This will fail to publish');

      await page.click('[data-testid="publish-now-button"]');
      await page.click('text=/Confirm|Yes, publish/');

      // Should show error message
      await expect(page.locator('text=/Publish failed|Network error|Try again/')).toBeVisible({ timeout: 10000 });

      await context.setOffline(false);
    });

    test('should allow retry after publish failure', async ({ page, context }) => {
      // Fail first publish
      await context.setOffline(true);
      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'Retry test post');
      await page.click('[data-testid="publish-now-button"]');
      await page.click('text=/Confirm|Yes, publish/');

      // Wait for error
      await expect(page.locator('text=/Publish failed|Network error/')).toBeVisible({ timeout: 10000 });

      // Restore network
      await context.setOffline(false);

      // Click retry
      await page.click('[data-testid="retry-publish-button"]');

      // Should succeed
      await expect(page.locator('text=/Published successfully|Retry successful/')).toBeVisible({ timeout: 10000 });
    });

    test('should show publish progress indicator', async ({ page }) => {
      await page.check('input[value="twitter"]');
      await page.fill('[data-testid="content-editor"]', 'Testing publish progress');

      await page.click('[data-testid="publish-now-button"]');
      await page.click('text=/Confirm|Yes, publish/');

      // Progress indicator should appear
      await expect(page.locator('[data-testid="publish-progress"]')).toBeVisible();
      await expect(page.locator('text=/Publishing|Uploading/')).toBeVisible();
    });
  });

  test.describe('Draft Management', () => {
    test('should save post as draft', async ({ page }) => {
      await page.check('input[value="linkedin"]');
      await page.fill('[data-testid="content-editor"]', 'This is a draft post');

      await page.click('[data-testid="save-draft-button"]');

      // Should show draft saved confirmation
      await expect(page.locator('text=/Draft saved|Saved successfully/')).toBeVisible();
    });

    test('should auto-save draft periodically', async ({ page }) => {
      await page.fill('[data-testid="content-editor"]', 'Auto-save test content');

      // Wait for auto-save (usually 30-60 seconds)
      await page.waitForTimeout(35000);

      // Should show auto-save indicator
      await expect(page.locator('text=/Auto-saved|Last saved/')).toBeVisible();
    });

    test('should load draft when navigating back to composer', async ({ page }) => {
      const draftContent = 'Draft content to be loaded later';

      await page.fill('[data-testid="content-editor"]', draftContent);
      await page.click('[data-testid="save-draft-button"]');

      // Navigate away
      await page.click('text=Dashboard');

      // Navigate back to composer
      await page.click('text=Compose');

      // Click load draft
      await page.click('[data-testid="load-draft-button"]');

      // Should restore content
      await expect(page.locator('[data-testid="content-editor"]')).toHaveValue(draftContent);
    });

    test('should delete draft', async ({ page }) => {
      await page.fill('[data-testid="content-editor"]', 'Draft to delete');
      await page.click('[data-testid="save-draft-button"]');

      // Delete draft
      await page.click('[data-testid="delete-draft-button"]');
      await page.click('text=/Yes, delete|Confirm/');

      // Should show deletion confirmation
      await expect(page.locator('text=/Draft deleted|Deleted successfully/')).toBeVisible();

      // Editor should be cleared
      await expect(page.locator('[data-testid="content-editor"]')).toHaveValue('');
    });
  });

  test.describe('Content Validation', () => {
    test('should prevent publishing empty content', async ({ page }) => {
      await page.check('input[value="twitter"]');

      // Try to publish without content
      await page.click('[data-testid="publish-now-button"]');

      // Should show validation error
      await expect(page.locator('text=/Content required|Cannot publish empty/')).toBeVisible();

      // Publish button should remain disabled or show error
      await expect(page.locator('[data-testid="publish-now-button"]')).toBeDisabled();
    });

    test('should prevent publishing without platform selection', async ({ page }) => {
      await page.fill('[data-testid="content-editor"]', 'Content without platform');

      // Try to publish without selecting platform
      await page.click('[data-testid="publish-now-button"]');

      // Should show validation error
      await expect(page.locator('text=/Select platform|Choose at least one/')).toBeVisible();
    });

    test('should validate content meets platform requirements', async ({ page }) => {
      await page.check('input[value="twitter"]');

      // Twitter requires content
      await page.click('[data-testid="publish-now-button"]');

      // Should show platform-specific validation
      await expect(page.locator('text=/Twitter requires|Platform requirement/')).toBeVisible();
    });
  });
});
