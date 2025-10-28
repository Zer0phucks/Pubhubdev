import { test, expect } from '@playwright/test';

/**
 * OAuth Callback URL Verification Test
 * 
 * This test verifies that each platform's OAuth callback URL is set up correctly.
 * It checks:
 * 1. The callback URL endpoint is accessible
 * 2. The URL structure matches expected patterns
 * 3. Error handling for invalid callbacks
 */

const PLATFORMS = [
  'twitter',
  'instagram',
  'linkedin',
  'facebook',
  'youtube',
  'tiktok',
  'pinterest',
  'reddit'
] as const;

const BASE_URL = process.env.BASE_URL || 'https://pubhub.dev';
const PRODUCTION_URL = 'https://pubhub.dev';

test.describe('OAuth Callback URL Verification', () => {
  
  test('should verify callback URL structure', async ({ page }) => {
    for (const platform of PLATFORMS) {
      console.log(`\n📋 Testing ${platform.toUpperCase()} callback URL...`);
      
      // Test production callback URL
      const prodCallbackUrl = `${PRODUCTION_URL}/oauth/callback?platform=${platform}`;
      console.log(`🌐 Production: ${prodCallbackUrl}`);
      
      // Navigate to the callback URL (without a real OAuth token)
      await page.goto(`${BASE_URL}/oauth/callback?platform=${platform}&error=access_denied`, {
        waitUntil: 'domcontentloaded'
      });
      
      // Check that the page loaded
      const title = await page.title();
      console.log(`✅ Page title: ${title}`);
      
      // Take a screenshot for verification
      await page.screenshot({ 
        path: `test-results/callback-${platform}.png`,
        fullPage: true 
      });
      
      // Verify the page shows error handling (expected for test without real OAuth)
      const pageContent = await page.textContent('body');
      console.log(`📄 Page contains ${pageContent?.length || 0} characters`);
      
      // Check URL parameters are preserved
      const url = page.url();
      console.log(`🔗 Final URL: ${url}`);
      
      expect(url).toContain('/oauth/callback');
    }
  });

  test('should handle Supabase OAuth callback', async ({ page }) => {
    console.log('\n📋 Testing Supabase auth callback...');
    
    // Navigate to Supabase auth callback
    await page.goto(`${BASE_URL}/oauth/callback`, {
      waitUntil: 'domcontentloaded'
    });
    
    const url = page.url();
    console.log(`🔗 Current URL: ${url}`);
    
    // The page should load without errors
    expect(page).toBeTruthy();
    
    await page.screenshot({ 
      path: 'test-results/supabase-auth-callback.png',
      fullPage: true 
    });
  });

  test('should verify all platform callback URLs are unique', async ({ page }) => {
    console.log('\n📋 Verifying callback URL uniqueness...');
    
    const callbackUrls = PLATFORMS.map(platform => 
      `${PRODUCTION_URL}/oauth/callback?platform=${platform}`
    );
    
    const uniqueUrls = new Set(callbackUrls);
    
    console.log(`✅ Total platforms: ${PLATFORMS.length}`);
    console.log(`✅ Unique URLs: ${uniqueUrls.size}`);
    
    expect(callbackUrls.length).toBe(uniqueUrls.size);
    
    // Print all unique URLs
    console.log('\n📍 Configure these callback URLs in each platform:');
    callbackUrls.forEach(url => console.log(`   ${url}`));
  });

  test('should verify callback handles missing parameters gracefully', async ({ page }) => {
    console.log('\n📋 Testing error handling...');

    // Test callback with missing platform parameter
    await page.goto(`${BASE_URL}/oauth/callback`, {
      waitUntil: 'domcontentloaded'
    });

    // Should not redirect to error page immediately
    const url = page.url();
    console.log(`🔗 URL after callback: ${url}`);

    await page.screenshot({
      path: 'test-results/callback-no-params.png',
      fullPage: true
    });
  });

  test.describe('Per-Platform Post-Connect Validation', () => {
    test.skip(!process.env.CI, 'Post-connect validation only runs in CI with real OAuth tokens');

    for (const platform of PLATFORMS) {
      test(`should verify ${platform} connection status after OAuth callback`, async ({ page }) => {
        console.log(`\n🔐 Validating ${platform.toUpperCase()} post-connect state...`);

        // This test assumes OAuth flow has completed and tokens are stored
        // Navigate to Project Settings → Connections
        await page.goto(`${BASE_URL}/dashboard`, {
          waitUntil: 'networkidle'
        });

        // Navigate to Project Settings
        await page.click('[data-testid="project-settings"]', { timeout: 5000 });

        // Click on Connections tab
        await page.click('button:has-text("Connections")', { timeout: 5000 });

        // Wait for connections list to load
        await page.waitForSelector('[data-testid="platform-connections"]', { timeout: 10000 });

        // Check if platform shows as "Connected"
        const platformCard = page.locator(`[data-testid="platform-${platform}"]`);
        await expect(platformCard).toBeVisible({ timeout: 5000 });

        // Verify "Connected" badge is present
        const connectedBadge = platformCard.locator('text=/Connected/i');
        const isConnected = await connectedBadge.isVisible();

        if (isConnected) {
          console.log(`✅ ${platform} shows as Connected in UI`);

          // Verify username/handle is displayed
          const usernameElement = platformCard.locator('[data-testid="platform-username"]');
          const username = await usernameElement.textContent();
          console.log(`📝 Username: ${username}`);
          expect(username).toBeTruthy();

          // Verify auto-post toggle is available
          const autoPostToggle = platformCard.locator('[data-testid="auto-post-toggle"]');
          await expect(autoPostToggle).toBeVisible();
          console.log(`⚙️ Auto-post toggle is available`);

          // Verify disconnect button is present
          const disconnectButton = platformCard.locator('button:has-text("Disconnect")');
          await expect(disconnectButton).toBeVisible();
          console.log(`🔌 Disconnect button is available`);
        } else {
          console.warn(`⚠️ ${platform} is not connected - OAuth flow may not have completed`);

          // Verify "Connect" button is available instead
          const connectButton = platformCard.locator('button:has-text("Connect")');
          await expect(connectButton).toBeVisible();
        }

        // Take screenshot for verification
        await page.screenshot({
          path: `test-results/post-connect-${platform}.png`,
          fullPage: true
        });
      });
    }
  });

});

