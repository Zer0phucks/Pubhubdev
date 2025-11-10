import { test, expect } from '@playwright/test';
import { generateTestUserEmail } from './helpers/auth.helper';

/**
 * Complete Onboarding Flow Tests
 * Tests the full user onboarding journey from signup to first project creation
 */

test.describe('Complete Onboarding Flow', () => {
  let testUserEmail: string;

  test.beforeEach(() => {
    testUserEmail = generateTestUserEmail();
  });

  test.describe('Sign Up Flow', () => {
    test('should complete full onboarding flow successfully', async ({ page }) => {
      // Step 1: Land on homepage
      await page.goto('/');
      await expect(page.locator('text=/Welcome to PubHub|Get Started/')).toBeVisible();

      // Step 2: Click Sign Up
      await page.click('text=Sign Up');
      await expect(page).toHaveURL(/signup|auth/);

      // Step 3: Fill registration form
      await page.fill('input[type="email"]', testUserEmail);
      await page.fill('input[type="password"]', 'SecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

      // Accept terms and conditions
      await page.check('input[name="agreeToTerms"]');

      // Step 4: Submit registration
      await page.click('button[type="submit"]');

      // Step 5: Email verification notice (if applicable)
      const emailVerificationVisible = await page.locator('text=/Verify your email|Check your inbox/').isVisible();

      if (emailVerificationVisible) {
        // Mock email verification by navigating directly
        await page.goto('/auth/verify?token=mock_verification_token');
      }

      // Step 6: Should land on profile setup or dashboard
      await expect(page).toHaveURL(/dashboard|profile|onboarding/);

      // Step 7: Complete profile setup (if prompted)
      const profileSetupVisible = await page.locator('[data-testid="profile-setup"]').isVisible();

      if (profileSetupVisible) {
        await page.fill('[data-testid="profile-name"]', 'Test User');
        await page.fill('[data-testid="profile-bio"]', 'Testing PubHub onboarding');
        await page.click('button:has-text("Continue")');
      }

      // Step 8: Project creation prompt
      const projectSetupVisible = await page.locator('[data-testid="project-setup"]').isVisible();

      if (projectSetupVisible) {
        await page.fill('[data-testid="project-name"]', 'My First Project');
        await page.fill('[data-testid="project-description"]', 'First project for testing');

        // Select platforms
        await page.check('input[value="twitter"]');
        await page.check('input[value="linkedin"]');

        await page.click('button:has-text("Create Project")');
      }

      // Step 9: Should land on dashboard with welcome message
      await expect(page).toHaveURL(/dashboard/);
      await expect(page.locator('text=/Welcome|Get started|Dashboard/')).toBeVisible();

      // Step 10: Verify user is authenticated
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should validate email format during signup', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Sign Up');

      // Invalid email
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');

      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('text=/Invalid email|Email format/')).toBeVisible();
    });

    test('should validate password strength requirements', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Sign Up');

      await page.fill('input[type="email"]', testUserEmail);

      // Weak password (too short)
      await page.fill('input[type="password"]', 'pass');
      await page.fill('input[name="confirmPassword"]', 'pass');

      await page.click('button[type="submit"]');

      // Should show password strength error
      await expect(page.locator('text=/Password too weak|minimum 8 characters|stronger password/')).toBeVisible();
    });

    test('should validate password confirmation match', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Sign Up');

      await page.fill('input[type="email"]', testUserEmail);
      await page.fill('input[type="password"]', 'SecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

      await page.click('button[type="submit"]');

      // Should show mismatch error
      await expect(page.locator('text=/Passwords do not match|Password mismatch/')).toBeVisible();
    });

    test('should require terms and conditions acceptance', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Sign Up');

      await page.fill('input[type="email"]', testUserEmail);
      await page.fill('input[type="password"]', 'SecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

      // Don't check terms
      await page.click('button[type="submit"]');

      // Should show terms error
      await expect(page.locator('text=/Accept terms|Terms and conditions required/')).toBeVisible();
    });

    test('should prevent duplicate email registration', async ({ page }) => {
      const duplicateEmail = 'existing-user@pubhub-test.com';

      // First registration
      await page.goto('/');
      await page.click('text=Sign Up');
      await page.fill('input[type="email"]', duplicateEmail);
      await page.fill('input[type="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      await page.check('input[name="agreeToTerms"]');
      await page.click('button[type="submit"]');

      // Sign out
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Sign Out');

      // Attempt duplicate registration
      await page.click('text=Sign Up');
      await page.fill('input[type="email"]', duplicateEmail);
      await page.fill('input[type="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      await page.check('input[name="agreeToTerms"]');
      await page.click('button[type="submit"]');

      // Should show duplicate email error
      await expect(page.locator('text=/Email already exists|Account already registered|Already in use/')).toBeVisible();
    });
  });

  test.describe('OAuth Sign Up', () => {
    test('should allow signup with Google OAuth', async ({ page, context }) => {
      await page.goto('/');
      await page.click('text=Sign Up');

      // Click Google sign up
      const popupPromise = context.waitForEvent('page');
      await page.click('[data-testid="signup-google"]');

      const popup = await popupPromise;
      await expect(popup).toHaveURL(/accounts\.google\.com|googleapis\.com/);

      await popup.close();

      // Note: Full OAuth flow requires real credentials
      // This test validates popup opens correctly
    });

    test('should allow signup with Facebook OAuth', async ({ page, context }) => {
      await page.goto('/');
      await page.click('text=Sign Up');

      const popupPromise = context.waitForEvent('page');
      await page.click('[data-testid="signup-facebook"]');

      const popup = await popupPromise;
      await expect(popup).toHaveURL(/facebook\.com|fb\.com/);

      await popup.close();
    });

    test('should allow signup with Twitter OAuth', async ({ page, context }) => {
      await page.goto('/');
      await page.click('text=Sign Up');

      const popupPromise = context.waitForEvent('page');
      await page.click('[data-testid="signup-twitter"]');

      const popup = await popupPromise;
      await expect(popup).toHaveURL(/twitter\.com|x\.com/);

      await popup.close();
    });

    test('should allow signup with LinkedIn OAuth', async ({ page, context }) => {
      await page.goto('/');
      await page.click('text=Sign Up');

      const popupPromise = context.waitForEvent('page');
      await page.click('[data-testid="signup-linkedin"]');

      const popup = await popupPromise;
      await expect(popup).toHaveURL(/linkedin\.com/);

      await popup.close();
    });
  });

  test.describe('Email Verification', () => {
    test('should send verification email after signup', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Sign Up');

      await page.fill('input[type="email"]', testUserEmail);
      await page.fill('input[type="password"]', 'SecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');
      await page.check('input[name="agreeToTerms"]');

      await page.click('button[type="submit"]');

      // Should show email verification notice
      await expect(page.locator('text=/Verify your email|Check your inbox|Verification email sent/')).toBeVisible({ timeout: 10000 });
    });

    test('should allow resending verification email', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Sign Up');

      await page.fill('input[type="email"]', testUserEmail);
      await page.fill('input[type="password"]', 'SecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');
      await page.check('input[name="agreeToTerms"]');

      await page.click('button[type="submit"]');

      // Click resend verification
      await page.click('[data-testid="resend-verification"]');

      // Should show resend confirmation
      await expect(page.locator('text=/Verification email resent|Email sent/')).toBeVisible();
    });

    test('should verify email with valid token', async ({ page }) => {
      // Navigate to verification URL with mock token
      await page.goto('/auth/verify?token=valid_mock_token');

      // Should show verification success
      await expect(page.locator('text=/Email verified|Verification successful/')).toBeVisible();

      // Should redirect to dashboard or next step
      await expect(page).toHaveURL(/dashboard|profile|onboarding/);
    });

    test('should handle invalid verification token', async ({ page }) => {
      await page.goto('/auth/verify?token=invalid_token');

      // Should show error message
      await expect(page.locator('text=/Invalid token|Verification failed|Link expired/')).toBeVisible();
    });
  });

  test.describe('Profile Setup', () => {
    test('should complete profile setup after email verification', async ({ page }) => {
      // Mock verified user state
      await page.goto('/onboarding/profile');

      await page.fill('[data-testid="profile-name"]', 'Test User');
      await page.fill('[data-testid="profile-bio"]', 'Social media manager testing PubHub');

      // Optional: Upload profile picture
      const uploadVisible = await page.locator('[data-testid="upload-avatar"]').isVisible();
      if (uploadVisible) {
        const fileInput = page.locator('input[type="file"][accept*="image"]');
        await fileInput.setInputFiles({
          name: 'avatar.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-avatar-data'),
        });
      }

      await page.click('button:has-text("Continue")');

      // Should proceed to next onboarding step
      await expect(page).toHaveURL(/project|dashboard/);
    });

    test('should allow skipping optional profile fields', async ({ page }) => {
      await page.goto('/onboarding/profile');

      // Only fill required fields
      await page.fill('[data-testid="profile-name"]', 'Test User');

      // Skip optional bio
      await page.click('button:has-text("Continue")');

      // Should still proceed
      await expect(page).toHaveURL(/project|dashboard/);
    });

    test('should validate profile name is required', async ({ page }) => {
      await page.goto('/onboarding/profile');

      // Skip name field
      await page.click('button:has-text("Continue")');

      // Should show validation error
      await expect(page.locator('text=/Name is required|Please enter your name/')).toBeVisible();
    });
  });

  test.describe('First Project Creation', () => {
    test('should create first project during onboarding', async ({ page }) => {
      await page.goto('/onboarding/project');

      await page.fill('[data-testid="project-name"]', 'My First Project');
      await page.fill('[data-testid="project-description"]', 'Social media project for my business');

      // Select platforms to manage
      await page.check('input[value="twitter"]');
      await page.check('input[value="instagram"]');
      await page.check('input[value="linkedin"]');

      await page.click('button:has-text("Create Project")');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/);

      // Should show welcome message
      await expect(page.locator('text=/Welcome to PubHub|Your project is ready|Get started/')).toBeVisible();
    });

    test('should validate project name is required', async ({ page }) => {
      await page.goto('/onboarding/project');

      await page.check('input[value="twitter"]');
      await page.click('button:has-text("Create Project")');

      // Should show validation error
      await expect(page.locator('text=/Project name required|Please name your project/')).toBeVisible();
    });

    test('should require at least one platform selection', async ({ page }) => {
      await page.goto('/onboarding/project');

      await page.fill('[data-testid="project-name"]', 'Test Project');
      await page.click('button:has-text("Create Project")');

      // Should show validation error
      await expect(page.locator('text=/Select at least one platform|Choose platform/')).toBeVisible();
    });

    test('should allow skipping project creation during onboarding', async ({ page }) => {
      await page.goto('/onboarding/project');

      await page.click('[data-testid="skip-project-creation"]');

      // Should proceed to dashboard
      await expect(page).toHaveURL(/dashboard/);

      // Should show empty project prompt
      await expect(page.locator('text=/Create your first project|No projects yet/')).toBeVisible();
    });
  });

  test.describe('Onboarding Progress Tracking', () => {
    test('should display onboarding progress indicator', async ({ page }) => {
      await page.goto('/onboarding/profile');

      // Progress indicator should be visible
      await expect(page.locator('[data-testid="onboarding-progress"]')).toBeVisible();

      // Should show current step
      await expect(page.locator('[data-testid="current-step"]')).toContainText(/Profile|Step 1|1\/3/);
    });

    test('should allow navigating back in onboarding flow', async ({ page }) => {
      await page.goto('/onboarding/project');

      // Click back button
      await page.click('[data-testid="onboarding-back"]');

      // Should return to profile step
      await expect(page).toHaveURL(/profile/);
    });

    test('should persist onboarding progress across sessions', async ({ page, context }) => {
      // Complete profile step
      await page.goto('/onboarding/profile');
      await page.fill('[data-testid="profile-name"]', 'Test User');
      await page.click('button:has-text("Continue")');

      // Clear session (simulate closing browser)
      await context.clearCookies();

      // Reopen and sign in
      await page.goto('/');
      await page.click('text=Sign In');
      await page.fill('input[type="email"]', testUserEmail);
      await page.fill('input[type="password"]', 'SecurePassword123!');
      await page.click('button[type="submit"]');

      // Should resume at project creation step
      await expect(page).toHaveURL(/project/);
    });
  });
});
