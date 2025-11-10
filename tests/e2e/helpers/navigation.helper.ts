import { Page, expect } from '@playwright/test';

/**
 * Navigation helper utilities for E2E tests
 */

export async function navigateToDashboard(page: Page): Promise<void> {
  await page.click('text=Dashboard');
  await expect(page).toHaveURL(/dashboard/);
}

export async function navigateToCompose(page: Page): Promise<void> {
  await page.click('text=Compose');
  await expect(page).toHaveURL(/compose/);
}

export async function navigateToInbox(page: Page): Promise<void> {
  await page.click('text=Inbox');
  await expect(page).toHaveURL(/inbox/);
}

export async function navigateToCalendar(page: Page): Promise<void> {
  await page.click('text=Calendar');
  await expect(page).toHaveURL(/calendar/);
}

export async function navigateToAnalytics(page: Page): Promise<void> {
  await page.click('text=Analytics');
  await expect(page).toHaveURL(/analytics/);
}

export async function navigateToSettings(page: Page): Promise<void> {
  await page.click('text=Settings');
  await expect(page).toHaveURL(/settings/);
}

export async function navigateToPlatformConnections(page: Page): Promise<void> {
  await page.click('text=Platform Connections');
  await expect(page).toHaveURL(/platforms/);
}

/**
 * Open command palette (⌘K / Ctrl+K)
 */
export async function openCommandPalette(page: Page): Promise<void> {
  const isMac = process.platform === 'darwin';
  await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
  await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();
}

/**
 * Open AI chat assistant (⌘K)
 */
export async function openAIChat(page: Page): Promise<void> {
  await page.keyboard.press('K');
  await expect(page.locator('[data-testid="ai-chat-dialog"]')).toBeVisible();
}

/**
 * Navigate using keyboard shortcut
 */
export async function useKeyboardShortcut(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
}
