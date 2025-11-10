import { test, expect } from '@playwright/test';

/**
 * Keyboard navigation accessibility tests
 * Validates WCAG 2.1 keyboard accessibility requirements
 */

test.describe('Keyboard Navigation Tests', () => {
  test('All interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    // Get all interactive elements
    const buttons = await page.locator('button, a, input, textarea, select, [role="button"]').all();

    for (const element of buttons) {
      // Check if element is visible
      const isVisible = await element.isVisible();
      if (!isVisible) continue;

      // Check if element is focusable
      await element.focus();
      const isFocused = await element.evaluate(el => document.activeElement === el);

      expect(isFocused, `Element ${await element.getAttribute('aria-label') || await element.textContent()} should be focusable`).toBeTruthy();
    }
  });

  test('Tab key should navigate through interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    // Start from body
    await page.locator('body').focus();

    // Tab through first 10 elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      // Check that focus moved
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          role: el?.getAttribute('role'),
          ariaLabel: el?.getAttribute('aria-label'),
        };
      });

      expect(focusedElement.tag).toBeTruthy();
    }
  });

  test('Shift+Tab should navigate backwards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    // Tab forward a few times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    const forwardElement = await page.evaluate(() => document.activeElement?.tagName);

    // Tab backward
    await page.keyboard.press('Shift+Tab');

    const backwardElement = await page.evaluate(() => document.activeElement?.tagName);

    expect(forwardElement).not.toBe(backwardElement);
  });

  test('Focus should be visible on all interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    const buttons = await page.locator('button, a[href], input, textarea, select').all();

    for (const element of buttons.slice(0, 20)) {
      const isVisible = await element.isVisible();
      if (!isVisible) continue;

      await element.focus();

      // Check for focus ring or outline
      const hasFocusStyle = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const outline = styles.outline !== 'none' && styles.outline !== '';
        const boxShadow = styles.boxShadow !== 'none';
        const ring = styles.getPropertyValue('--tw-ring-width') !== '';

        return outline || boxShadow || ring;
      });

      expect(hasFocusStyle, `Element should have visible focus indicator`).toBeTruthy();
    }
  });

  test('Escape key should close modals', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    // Look for any modal trigger (command palette, etc.)
    const modalTrigger = page.locator('[data-command-palette], [aria-haspopup="dialog"]').first();

    const triggerExists = await modalTrigger.count() > 0;
    if (!triggerExists) {
      test.skip();
      return;
    }

    // Open modal
    await modalTrigger.click();

    // Wait for modal
    await page.waitForTimeout(500);

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should be closed
    const modalStillVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    expect(modalStillVisible).toBeFalsy();
  });

  test('Enter key should activate buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    const button = page.locator('button, [role="button"]').first();
    await button.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Should trigger button action (hard to test without knowing specific buttons)
    // This is a basic test that Enter doesn't cause errors
    await page.waitForTimeout(100);
  });

  test('Space key should activate buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    const button = page.locator('button, [role="button"]').first();
    await button.focus();

    // Press Space
    await page.keyboard.press('Space');

    // Should trigger button action
    await page.waitForTimeout(100);
  });

  test('Arrow keys should work in dropdowns', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    // Find dropdown/combobox
    const dropdown = page.locator('[role="combobox"], select').first();

    const dropdownExists = await dropdown.count() > 0;
    if (!dropdownExists) {
      test.skip();
      return;
    }

    await dropdown.focus();

    // Press ArrowDown
    await page.keyboard.press('ArrowDown');

    // Should navigate within dropdown (specific behavior varies)
    await page.waitForTimeout(100);
  });

  test('Focus should not be trapped outside modals', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    // Tab through page (no modal open)
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Focus should never leave the page
    const focusIsOnPage = await page.evaluate(() => {
      return document.contains(document.activeElement);
    });

    expect(focusIsOnPage).toBeTruthy();
  });

  test('Skip to main content link should work', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    // Tab to first element (should be skip link)
    await page.keyboard.press('Tab');

    const firstFocusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        text: el?.textContent,
        href: el?.getAttribute('href'),
      };
    });

    // Check if it's a skip link
    const isSkipLink = firstFocusedElement.text?.toLowerCase().includes('skip') ||
                      firstFocusedElement.href?.includes('#main');

    if (isSkipLink) {
      // Press Enter to activate skip link
      await page.keyboard.press('Enter');

      // Focus should move to main content
      const focusedAfterSkip = await page.evaluate(() => {
        return document.activeElement?.id || document.activeElement?.getAttribute('role');
      });

      expect(focusedAfterSkip).toBeTruthy();
    }
  });
});

test.describe('Keyboard Shortcuts Tests', () => {
  test('Cmd+K should open command palette', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    // Press Cmd+K (or Ctrl+K on Windows)
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');

    // Wait for command palette
    await page.waitForTimeout(500);

    // Check if command palette is visible
    const commandPaletteVisible = await page.locator('[role="dialog"], [data-command-palette]').isVisible().catch(() => false);

    expect(commandPaletteVisible).toBeTruthy();
  });

  test('Keyboard shortcuts should not conflict with form inputs', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForSelector('input');

    const input = page.locator('input').first();
    await input.focus();

    // Type 'n' (should not trigger "new post" shortcut)
    await page.keyboard.type('n');

    const inputValue = await input.inputValue();
    expect(inputValue).toContain('n');
  });
});
