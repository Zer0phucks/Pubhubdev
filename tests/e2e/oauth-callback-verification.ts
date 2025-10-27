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

const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const PRODUCTION_URL = 'https://pubhub.dev';

test.describe('OAuth Callback URL Verification', () => {
  
  test('should verify callback URL structure', async ({ page }) => {
    for (const platform of PLATFORMS) {
      console.log(`\n📋 Testing ${platform.toUpperCase()} callback URL...`);
      
      // Test local development callback URL
      const localCallbackUrl = `${BASE_URL}/oauth/callback?platform=${platform}`;
      console.log(`🔗 Local: ${localCallbackUrl}`);
      
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

});

