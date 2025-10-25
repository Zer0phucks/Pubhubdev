import { test, expect } from '@playwright/test';

test.describe('Project Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is signed in
    await page.goto('/dashboard');
  });

  test('user can create a new project', async ({ page }) => {
    // Click project switcher
    await page.click('[data-testid="project-switcher"]');
    
    // Click create new project
    await page.click('text=Create New Project');
    
    // Fill project details
    await page.fill('[data-testid="project-name"]', 'My New Project');
    await page.fill('[data-testid="project-description"]', 'A project for testing automation');
    
    // Select platforms
    await page.check('input[value="twitter"]');
    await page.check('input[value="linkedin"]');
    
    // Create project
    await page.click('text=Create Project');
    
    // Should show success and switch to new project
    await expect(page.locator('text=Project created successfully')).toBeVisible();
    await expect(page.locator('[data-testid="project-name"]')).toContainText('My New Project');
  });

  test('user can switch between projects', async ({ page }) => {
    // Click project switcher
    await page.click('[data-testid="project-switcher"]');
    
    // Select different project
    await page.click('[data-testid="project-item-2"]');
    
    // Should update project context
    await expect(page.locator('[data-testid="current-project"]')).toContainText('Project 2');
  });

  test('user can edit project settings', async ({ page }) => {
    // Navigate to project settings
    await page.click('text=Project Settings');
    
    // Edit project name
    await page.fill('[data-testid="project-name"]', 'Updated Project Name');
    
    // Update description
    await page.fill('[data-testid="project-description"]', 'Updated description');
    
    // Save changes
    await page.click('text=Save Changes');
    
    // Should show success message
    await expect(page.locator('text=Project updated successfully')).toBeVisible();
  });

  test('user can delete project', async ({ page }) => {
    // Navigate to project settings
    await page.click('text=Project Settings');
    
    // Click delete project
    await page.click('text=Delete Project');
    
    // Confirm deletion
    await page.click('text=Yes, Delete Project');
    
    // Should redirect to project selection
    await expect(page).toHaveURL('/projects');
    await expect(page.locator('text=Select a project to continue')).toBeVisible();
  });
});
