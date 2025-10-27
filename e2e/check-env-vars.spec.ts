import { test, expect, type Page } from '@playwright/test';

/**
 * Environment Variable Verification Test
 * 
 * This test helps verify that all required environment variables are set up correctly
 * in both Supabase and Vercel dashboards.
 * 
 * IMPORTANT: This test requires manual authentication to both dashboards.
 * Follow the prompts to log in when requested.
 */

// Expected environment variables
const EXPECTED_VERCEL_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SENTRY_DSN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'SENTRY_AUTH_TOKEN'
];

const EXPECTED_SUPABASE_SECRETS = [
  'FRONTEND_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'TWITTER_CLIENT_ID',
  'TWITTER_CLIENT_SECRET',
  'INSTAGRAM_CLIENT_ID',
  'INSTAGRAM_CLIENT_SECRET',
  'FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'YOUTUBE_CLIENT_ID',
  'YOUTUBE_CLIENT_SECRET',
  'TIKTOK_CLIENT_KEY',
  'TIKTOK_CLIENT_SECRET',
  'PINTEREST_APP_ID',
  'PINTEREST_APP_SECRET',
  'REDDIT_CLIENT_ID',
  'REDDIT_CLIENT_SECRET'
];

// Expected values for critical variables
const EXPECTED_VALUES = {
  'VITE_SUPABASE_URL': 'https://ykzckfwdvmzuzxhezthv.supabase.co',
  'VITE_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlremNrZndkdm16dXp4aGV6dGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTM2OTIsImV4cCI6MjA3Njk4OTY5Mn0.UoI8-lcWPepwOJz0nML-70f3MnxseCwB_AMedHLoVZE'
};

interface EnvVarCheck {
  name: string;
  present: boolean;
  hasValue: boolean;
  actualValue?: string;
}

test.describe('Environment Variable Verification', () => {
  test('Check Vercel environment variables', async ({ page, context }) => {
    console.log('\n🔍 Starting Vercel environment variable check...\n');
    
    // Navigate to Vercel dashboard
    console.log('⏳ Navigating to Vercel dashboard...');
    console.log('⚠️  You will need to authenticate manually when prompted.\n');
    
    await page.goto('https://vercel.com/login');
    
    // Wait for manual login
    console.log('⏸️  Please log in to Vercel now...');
    console.log('📋 After logging in, you will be asked to navigate to your project settings.\n');
    
    // Wait for navigation to complete after login
    await page.waitForURL('**/dashboard**', { timeout: 120000 });
    
    console.log('✅ Vercel login detected. Please navigate to your project settings.');
    console.log('📝 To check environment variables, go to:');
    console.log('   Settings → Environment Variables\n');
    
    // Try to detect if we're on the project settings page
    const isOnSettingsPage = await page.locator('text=/Environment Variables|Env Vars/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isOnSettingsPage) {
      console.log('⚠️  Could not automatically navigate to environment variables page.');
      console.log('📝 Please manually navigate to: Settings → Environment Variables');
      console.log('⏸️  Press Enter to continue after you have navigated to the page...\n');
      
      // Wait for user to manually navigate
      await new Promise(resolve => {
        process.stdin.once('data', () => {
          resolve(undefined);
        });
      });
    }
    
    // Extract environment variables from the page
    const envVars = await extractEnvVarsFromPage(page);
    
    console.log('\n📊 VERCEL ENVIRONMENT VARIABLES CHECK RESULTS:');
    console.log('=' .repeat(50));
    
    const results: EnvVarCheck[] = EXPECTED_VERCEL_VARS.map(varName => {
      const env = envVars.find(e => e.name === varName);
      return {
        name: varName,
        present: !!env,
        hasValue: !!env?.value && env.value.length > 0,
        actualValue: env?.value
      };
    });
    
    // Display results
    results.forEach(result => {
      if (result.present && result.hasValue) {
        console.log(`✅ ${result.name}: Set (${result.actualValue?.substring(0, 30)}...)`);
      } else if (result.present) {
        console.log(`⚠️  ${result.name}: Present but empty`);
      } else {
        console.log(`❌ ${result.name}: MISSING`);
      }
    });
    
    // Check for critical variables
    const criticalVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    let criticalIssues = false;
    
    criticalVars.forEach(varName => {
      const result = results.find(r => r.name === varName);
      if (!result?.hasValue) {
        console.log(`\n🔴 CRITICAL: ${varName} is missing or empty!`);
        criticalIssues = true;
      }
    });
    
    // Verify critical values match expected
    if (result?.hasValue) {
      const supabaseUrlResult = results.find(r => r.name === 'VITE_SUPABASE_URL');
      const supabaseKeyResult = results.find(r => r.name === 'VITE_SUPABASE_ANON_KEY');
      
      if (supabaseUrlResult?.actualValue && supabaseUrlResult.actualValue !== EXPECTED_VALUES['VITE_SUPABASE_URL']) {
        console.log(`\n⚠️  VITE_SUPABASE_URL mismatch! Expected: ${EXPECTED_VALUES['VITE_SUPABASE_URL']}`);
        criticalIssues = true;
      }
      
      if (supabaseKeyResult?.actualValue && supabaseKeyResult.actualValue !== EXPECTED_VALUES['VITE_SUPABASE_ANON_KEY']) {
        console.log(`\n⚠️  VITE_SUPABASE_ANON_KEY mismatch!`);
        criticalIssues = true;
      }
    }
    
    if (criticalIssues) {
      console.log('\n🔴 Critical environment variables are missing or incorrect!');
      throw new Error('Critical environment variables are not configured correctly.');
    }
    
    console.log('\n✅ Vercel environment variables check completed!');
  });
  
  test('Check Supabase secrets', async ({ page }) => {
    console.log('\n🔍 Starting Supabase secrets check...\n');
    
    // Navigate to Supabase dashboard
    console.log('⏳ Navigating to Supabase dashboard...');
    console.log('⚠️  You will need to authenticate manually when prompted.\n');
    
    await page.goto('https://supabase.com/dashboard/projects');
    
    // Wait for manual login
    console.log('⏸️  Please log in to Supabase now...');
    console.log('📋 After logging in, you will be asked to navigate to your project settings.\n');
    
    // Try to find the project or wait for navigation
    await page.waitForTimeout(5000);
    
    console.log('✅ Supabase login detected.');
    console.log('📝 To check Edge Function secrets, go to:');
    console.log('   Project Settings → Edge Functions → Secrets\n');
    console.log('⏸️  Press Enter to continue after you have navigated to the secrets page...\n');
    
    // Wait for user to manually navigate
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        resolve(undefined);
      });
    });
    
    // Extract secrets from the page
    const secrets = await extractSecretsFromPage(page);
    
    console.log('\n📊 SUPABASE SECRETS CHECK RESULTS:');
    console.log('=' .repeat(50));
    
    const results: EnvVarCheck[] = EXPECTED_SUPABASE_SECRETS.map(secretName => {
      const secret = secrets.find(s => s.name === secretName);
      return {
        name: secretName,
        present: !!secret,
        hasValue: !!secret?.value && secret.value.length > 0,
        actualValue: secret?.value
      };
    });
    
    // Display results
    results.forEach(result => {
      if (result.present && result.hasValue) {
        console.log(`✅ ${result.name}: Set`);
      } else if (result.present) {
        console.log(`⚠️  ${result.name}: Present but empty`);
      } else {
        console.log(`❌ ${result.name}: MISSING`);
      }
    });
    
    // Categorize by platform
    console.log('\n📋 Platform OAuth Credentials:');
    const platforms = [
      { name: 'Twitter', clientId: 'TWITTER_CLIENT_ID', secret: 'TWITTER_CLIENT_SECRET' },
      { name: 'Instagram', clientId: 'INSTAGRAM_CLIENT_ID', secret: 'INSTAGRAM_CLIENT_SECRET' },
      { name: 'Facebook', clientId: 'FACEBOOK_APP_ID', secret: 'FACEBOOK_APP_SECRET' },
      { name: 'LinkedIn', clientId: 'LINKEDIN_CLIENT_ID', secret: 'LINKEDIN_CLIENT_SECRET' },
      { name: 'YouTube', clientId: 'YOUTUBE_CLIENT_ID', secret: 'YOUTUBE_CLIENT_SECRET' },
      { name: 'TikTok', clientId: 'TIKTOK_CLIENT_KEY', secret: 'TIKTOK_CLIENT_SECRET' },
      { name: 'Pinterest', clientId: 'PINTEREST_APP_ID', secret: 'PINTEREST_APP_SECRET' },
      { name: 'Reddit', clientId: 'REDDIT_CLIENT_ID', secret: 'REDDIT_CLIENT_SECRET' }
    ];
    
    platforms.forEach(platform => {
      const clientIdResult = results.find(r => r.name === platform.clientId);
      const secretResult = results.find(r => r.name === platform.secret);
      
      if (clientIdResult?.hasValue && secretResult?.hasValue) {
        console.log(`  ✅ ${platform.name}: Both credentials configured`);
      } else if (clientIdResult?.hasValue || secretResult?.hasValue) {
        console.log(`  ⚠️  ${platform.name}: Partially configured`);
      } else {
        console.log(`  ❌ ${platform.name}: Not configured`);
      }
    });
    
    // Check critical variables
    const criticalSecrets = ['FRONTEND_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    let criticalIssues = false;
    
    criticalSecrets.forEach(secretName => {
      const result = results.find(r => r.name === secretName);
      if (!result?.hasValue) {
        console.log(`\n🔴 CRITICAL: ${secretName} is missing or empty!`);
        criticalIssues = true;
      }
    });
    
    if (criticalIssues) {
      console.log('\n🔴 Critical Supabase secrets are missing or empty!');
      throw new Error('Critical Supabase secrets are not configured correctly.');
    }
    
    console.log('\n✅ Supabase secrets check completed!');
  });
});

// Helper function to extract environment variables from Vercel page
async function extractEnvVarsFromPage(page: Page): Promise<Array<{ name: string; value: string }>> {
  const envVars: Array<{ name: string; value: string }> = [];
  
  try {
    // Try different selectors for environment variables list
    const selectors = [
      '[data-testid="env-var-name"]',
      '[data-testid="environment-variable-name"]',
      'input[placeholder*="name"]',
      '.env-var-name',
      'td:first-child',
      '[class*="env"]',
    ];
    
    // Look for common patterns in environment variable tables
    const tableRows = await page.locator('table tbody tr, [role="row"]').all();
    
    for (const row of tableRows) {
      try {
        const nameCell = row.locator('td:first-child, th:first-child').first();
        const valueCell = row.locator('td:nth-child(2), td:last-child').first();
        
        const name = await nameCell.textContent();
        const value = await valueCell.textContent();
        
        if (name && name.trim().length > 0) {
          envVars.push({
            name: name.trim(),
            value: value?.trim() || ''
          });
        }
      } catch (e) {
        // Skip this row if extraction fails
      }
    }
    
    console.log(`📊 Extracted ${envVars.length} environment variables from page`);
  } catch (e) {
    console.log('⚠️  Could not automatically extract environment variables.');
    console.log('📝 Please manually verify the following variables are set:');
    EXPECTED_VERCEL_VARS.forEach(v => console.log(`   - ${v}`));
  }
  
  return envVars;
}

// Helper function to extract secrets from Supabase page
async function extractSecretsFromPage(page: Page): Promise<Array<{ name: string; value: string }>> {
  const secrets: Array<{ name: string; value: string }> = [];
  
  try {
    // Try different selectors for secrets list
    const tableRows = await page.locator('table tbody tr, [role="row"]').all();
    
    for (const row of tableRows) {
      try {
        const nameCell = row.locator('td:first-child, th:first-child').first();
        const valueCell = row.locator('td:nth-child(2), [type="password"]').first();
        
        const name = await nameCell.textContent();
        const valueAttr = await valueCell.getAttribute('value');
        const valueText = await valueCell.textContent();
        
        if (name && name.trim().length > 0) {
          secrets.push({
            name: name.trim(),
            value: valueAttr || valueText?.trim() || ''
          });
        }
      } catch (e) {
        // Skip this row if extraction fails
      }
    }
    
    console.log(`📊 Extracted ${secrets.length} secrets from page`);
  } catch (e) {
    console.log('⚠️  Could not automatically extract secrets.');
    console.log('📝 Please manually verify the following secrets are set:');
    EXPECTED_SUPABASE_SECRETS.forEach(s => console.log(`   - ${s}`));
  }
  
  return secrets;
}

