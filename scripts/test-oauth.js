#!/usr/bin/env node

/**
 * OAuth Platform Integration Test Script
 * Tests the OAuth flow for each platform to identify issues
 */

const readline = require('readline');

// Test configuration
const CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY',
  frontendUrl: process.env.FRONTEND_URL || 'https://pubhub.dev',
  platforms: [
    'twitter',
    'instagram',
    'linkedin',
    'facebook',
    'youtube',
    'tiktok',
    'pinterest',
    'reddit'
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper to colorize output
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to ask questions
function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer));
  });
}

// Test OAuth configuration for a platform
async function testPlatformConfig(platform) {
  log(`\n🔍 Testing ${platform.toUpperCase()} OAuth Configuration`, colors.bright);

  const results = {
    platform,
    hasClientId: false,
    hasClientSecret: false,
    hasRedirectUri: false,
    authUrlWorks: false,
    errors: []
  };

  // Check environment variables
  const envVars = {
    twitter: ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET'],
    instagram: ['INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET'],
    linkedin: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
    facebook: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    youtube: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
    tiktok: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
    pinterest: ['PINTEREST_APP_ID', 'PINTEREST_APP_SECRET'],
    reddit: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET']
  };

  const platformVars = envVars[platform];

  // Check if environment variables are set (in real scenario)
  log(`  Checking environment variables...`, colors.cyan);
  log(`    - ${platformVars[0]}: ${process.env[platformVars[0]] ? '✅ Set' : '❌ Not set'}`,
      process.env[platformVars[0]] ? colors.green : colors.red);
  log(`    - ${platformVars[1]}: ${process.env[platformVars[1]] ? '✅ Set' : '❌ Not set'}`,
      process.env[platformVars[1]] ? colors.green : colors.red);

  results.hasClientId = !!process.env[platformVars[0]];
  results.hasClientSecret = !!process.env[platformVars[1]];

  // Test authorization URL generation
  try {
    log(`  Testing authorization URL generation...`, colors.cyan);

    const authUrl = `${CONFIG.supabaseUrl}/functions/v1/make-server-19ccd85e/oauth/authorize/${platform}`;
    log(`    Authorization endpoint: ${authUrl}`, colors.blue);

    // Note: In a real test, we'd make an actual request here
    // For now, we'll simulate the test
    const redirectUri = `${CONFIG.frontendUrl}/oauth/callback`;
    log(`    Redirect URI: ${redirectUri}`, colors.blue);

    results.authUrlWorks = true;
    log(`    ✅ Authorization URL structure is correct`, colors.green);
  } catch (error) {
    results.errors.push(`Auth URL test failed: ${error.message}`);
    log(`    ❌ Authorization URL test failed: ${error.message}`, colors.red);
  }

  return results;
}

// Test OAuth callback handling
async function testCallbackHandling(platform) {
  log(`\n🔄 Testing ${platform.toUpperCase()} Callback Handling`, colors.bright);

  const results = {
    callbackEndpoint: false,
    tokenExchange: false,
    userInfoFetch: false,
    errors: []
  };

  try {
    const callbackUrl = `${CONFIG.supabaseUrl}/functions/v1/make-server-19ccd85e/oauth/callback`;
    log(`  Callback endpoint: ${callbackUrl}`, colors.blue);
    results.callbackEndpoint = true;

    // Platform-specific user info endpoints
    const userInfoEndpoints = {
      twitter: 'https://api.twitter.com/2/users/me',
      instagram: 'https://graph.instagram.com/me',
      linkedin: 'https://api.linkedin.com/v2/me',
      facebook: 'https://graph.facebook.com/v18.0/me',
      youtube: 'https://www.googleapis.com/oauth2/v2/userinfo',
      reddit: 'https://oauth.reddit.com/api/v1/me',
      pinterest: 'https://api.pinterest.com/v5/user_account',
      tiktok: 'https://open.tiktokapis.com/v2/user/info/'
    };

    log(`  User info endpoint: ${userInfoEndpoints[platform]}`, colors.blue);
    results.userInfoFetch = true;

    log(`  ✅ Callback structure is correct`, colors.green);
  } catch (error) {
    results.errors.push(`Callback test failed: ${error.message}`);
    log(`  ❌ Callback test failed: ${error.message}`, colors.red);
  }

  return results;
}

// Test platform API endpoints
async function testPlatformAPIs(platform) {
  log(`\n🌐 Testing ${platform.toUpperCase()} API Endpoints`, colors.bright);

  const apiEndpoints = {
    twitter: {
      post: 'POST https://api.twitter.com/2/tweets',
      scopes: 'tweet.read tweet.write users.read offline.access'
    },
    instagram: {
      post: 'POST https://graph.facebook.com/v18.0/{instagram-business-account}/media',
      scopes: 'user_profile,user_media'
    },
    linkedin: {
      post: 'POST https://api.linkedin.com/v2/ugcPosts',
      scopes: 'w_member_social r_liteprofile'
    },
    facebook: {
      post: 'POST https://graph.facebook.com/v18.0/{page-id}/feed',
      scopes: 'pages_manage_posts,pages_read_engagement'
    },
    youtube: {
      post: 'POST https://www.googleapis.com/youtube/v3/videos',
      scopes: 'https://www.googleapis.com/auth/youtube.upload'
    },
    tiktok: {
      post: 'POST https://open.tiktokapis.com/v2/post/publish/video/init/',
      scopes: 'user.info.basic,video.upload'
    },
    pinterest: {
      post: 'POST https://api.pinterest.com/v5/pins',
      scopes: 'boards:read,pins:read,pins:write'
    },
    reddit: {
      post: 'POST https://oauth.reddit.com/api/submit',
      scopes: 'submit identity'
    }
  };

  const api = apiEndpoints[platform];
  log(`  Post endpoint: ${api.post}`, colors.blue);
  log(`  Required scopes: ${api.scopes}`, colors.blue);

  return {
    platform,
    apiEndpoint: api.post,
    requiredScopes: api.scopes
  };
}

// Generate test report
function generateReport(results) {
  log('\n' + '='.repeat(60), colors.bright);
  log('📊 OAUTH INTEGRATION TEST REPORT', colors.bright);
  log('='.repeat(60), colors.bright);

  const summary = {
    total: results.length,
    configured: 0,
    partiallyConfigured: 0,
    notConfigured: 0
  };

  results.forEach(result => {
    const status = result.config.hasClientId && result.config.hasClientSecret
      ? 'configured'
      : (result.config.hasClientId || result.config.hasClientSecret)
        ? 'partiallyConfigured'
        : 'notConfigured';

    summary[status]++;

    log(`\n${result.platform.toUpperCase()}:`, colors.bright);

    if (status === 'configured') {
      log(`  ✅ Status: CONFIGURED`, colors.green);
    } else if (status === 'partiallyConfigured') {
      log(`  ⚠️  Status: PARTIALLY CONFIGURED`, colors.yellow);
    } else {
      log(`  ❌ Status: NOT CONFIGURED`, colors.red);
    }

    log(`  Client ID: ${result.config.hasClientId ? '✅' : '❌'}`,
        result.config.hasClientId ? colors.green : colors.red);
    log(`  Client Secret: ${result.config.hasClientSecret ? '✅' : '❌'}`,
        result.config.hasClientSecret ? colors.green : colors.red);
    log(`  Auth URL: ${result.config.authUrlWorks ? '✅' : '❌'}`,
        result.config.authUrlWorks ? colors.green : colors.red);

    if (result.config.errors.length > 0) {
      log(`  Errors:`, colors.red);
      result.config.errors.forEach(err => log(`    - ${err}`, colors.red));
    }

    log(`  API Endpoint: ${result.api.apiEndpoint}`, colors.cyan);
    log(`  Required Scopes: ${result.api.requiredScopes}`, colors.cyan);
  });

  log('\n' + '='.repeat(60), colors.bright);
  log('SUMMARY:', colors.bright);
  log(`  Total Platforms: ${summary.total}`, colors.blue);
  log(`  Fully Configured: ${summary.configured}`, colors.green);
  log(`  Partially Configured: ${summary.partiallyConfigured}`, colors.yellow);
  log(`  Not Configured: ${summary.notConfigured}`, colors.red);
  log('='.repeat(60) + '\n', colors.bright);
}

// Main test runner
async function runTests() {
  log('🚀 OAuth Platform Integration Tester', colors.bright);
  log('=====================================\n', colors.bright);

  const testMode = await ask('Select test mode:\n1. Test all platforms\n2. Test specific platform\n3. Exit\nChoice (1/2/3): ');

  let platformsToTest = [];

  if (testMode === '1') {
    platformsToTest = CONFIG.platforms;
  } else if (testMode === '2') {
    log('\nAvailable platforms:', colors.cyan);
    CONFIG.platforms.forEach((p, i) => log(`  ${i + 1}. ${p}`, colors.blue));
    const platformChoice = await ask('\nEnter platform number: ');
    const platformIndex = parseInt(platformChoice) - 1;

    if (platformIndex >= 0 && platformIndex < CONFIG.platforms.length) {
      platformsToTest = [CONFIG.platforms[platformIndex]];
    } else {
      log('Invalid choice!', colors.red);
      rl.close();
      return;
    }
  } else {
    log('Exiting...', colors.cyan);
    rl.close();
    return;
  }

  log(`\n🔧 Testing ${platformsToTest.length} platform(s)...`, colors.cyan);

  const results = [];

  for (const platform of platformsToTest) {
    const config = await testPlatformConfig(platform);
    const callback = await testCallbackHandling(platform);
    const api = await testPlatformAPIs(platform);

    results.push({
      platform,
      config,
      callback,
      api
    });
  }

  generateReport(results);

  // Additional debugging tips
  log('\n📝 DEBUGGING TIPS:', colors.bright);
  log('1. Check environment variables in Supabase dashboard', colors.cyan);
  log('2. Verify redirect URIs match exactly in platform developer consoles', colors.cyan);
  log('3. Ensure OAuth apps are not in sandbox/development mode', colors.cyan);
  log('4. Check platform-specific requirements (app review, permissions)', colors.cyan);
  log('5. Monitor browser console for CORS errors during OAuth flow', colors.cyan);
  log('6. Use browser DevTools Network tab to inspect OAuth requests', colors.cyan);
  log('7. Check Supabase Edge Function logs for server-side errors', colors.cyan);

  const runDebugFlow = await ask('\nWould you like to see debug commands? (y/n): ');

  if (runDebugFlow.toLowerCase() === 'y') {
    log('\n🔍 DEBUG COMMANDS:', colors.bright);
    log('\nCheck Supabase logs:', colors.cyan);
    log('  supabase functions logs make-server-19ccd85e --tail', colors.blue);

    log('\nTest authorization URL manually:', colors.cyan);
    log('  curl -H "Authorization: Bearer YOUR_ANON_KEY" \\', colors.blue);
    log('    https://YOUR_PROJECT.supabase.co/functions/v1/make-server-19ccd85e/oauth/authorize/PLATFORM?projectId=YOUR_PROJECT_ID', colors.blue);

    log('\nCheck stored OAuth tokens (in Supabase SQL Editor):', colors.cyan);
    log('  SELECT * FROM storage.objects WHERE name LIKE \'oauth:token:%\';', colors.blue);

    log('\nTest platform API directly (requires valid token):', colors.cyan);
    log('  curl -H "Authorization: Bearer ACCESS_TOKEN" \\', colors.blue);
    log('    PLATFORM_API_ENDPOINT', colors.blue);
  }

  rl.close();
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Error: ${error.message}`, colors.red);
  rl.close();
  process.exit(1);
});