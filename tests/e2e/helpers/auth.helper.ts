import { Page } from '@playwright/test';

/**
 * Authentication helper utilities for E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
}

/**
 * Create a test user account
 */
export async function createTestUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/');
  await page.click('text=Sign Up');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.fill('input[name="confirmPassword"]', user.password);
  await page.click('button[type="submit"]');
}

/**
 * Sign in with existing test user
 */
export async function signIn(page: Page, user: TestUser): Promise<void> {
  await page.goto('/');
  await page.click('text=Sign In');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
}

/**
 * Sign out current user
 */
export async function signOut(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Sign Out');
}

/**
 * Get authenticated page state (for setup)
 */
export async function getAuthenticatedState(page: Page, user: TestUser): Promise<void> {
  await signIn(page, user);
  // Wait for dashboard to confirm auth
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Generate unique test user email
 */
export function generateTestUserEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@pubhub-test.com`;
}
