import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign up with email and password', async ({ page }) => {
    await page.goto('/');
    
    // Click sign up button
    await page.click('text=Sign Up');
    
    // Fill in sign up form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome to PubHub')).toBeVisible();
  });

  test('user can sign in with existing credentials', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in button
    await page.click('text=Sign In');
    
    // Fill in sign in form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('user can sign out', async ({ page }) => {
    // Assume user is already signed in
    await page.goto('/dashboard');
    
    // Click user menu
    await page.click('[data-testid="user-menu"]');
    
    // Click sign out
    await page.click('text=Sign Out');
    
    // Should redirect to landing page
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Welcome to PubHub')).toBeVisible();
  });
});
