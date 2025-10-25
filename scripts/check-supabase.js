#!/usr/bin/env node

/**
 * Supabase Connection Diagnostic Script
 * Helps diagnose 404 errors and connection issues
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

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

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Read configuration
function getConfig() {
  // Try to read from .env file
  const envPath = path.join(__dirname, '..', '.env');
  let envVars = {};

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim();
      }
    });
  }

  // Read from info.tsx
  const infoPath = path.join(__dirname, '..', 'src', 'utils', 'supabase', 'info.tsx');
  let projectId = '';
  let anonKey = '';

  if (fs.existsSync(infoPath)) {
    const infoContent = fs.readFileSync(infoPath, 'utf8');
    const projectMatch = infoContent.match(/projectId = "([^"]+)"/);
    const keyMatch = infoContent.match(/publicAnonKey = "([^"]+)"/);

    if (projectMatch) projectId = projectMatch[1];
    if (keyMatch) anonKey = keyMatch[1];
  }

  return {
    envUrl: envVars.VITE_SUPABASE_URL,
    envKey: envVars.VITE_SUPABASE_ANON_KEY,
    fileProjectId: projectId,
    fileAnonKey: anonKey,
    computedUrl: `https://${projectId}.supabase.co`
  };
}

// Test HTTPS connection
function testConnection(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);

    https.get({
      hostname: urlObj.hostname,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'PubHub-Diagnostic/1.0'
      }
    }, (res) => {
      resolve({
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        headers: res.headers
      });
    }).on('error', (err) => {
      resolve({
        error: err.message
      });
    });
  });
}

// Test Supabase Auth endpoint
function testAuthEndpoint(url, anonKey) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);

    https.get({
      hostname: urlObj.hostname,
      path: '/auth/v1/health',
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'User-Agent': 'PubHub-Diagnostic/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          body: data
        });
      });
    }).on('error', (err) => {
      resolve({
        error: err.message
      });
    });
  });
}

// Main diagnostic function
async function runDiagnostics() {
  log('🔍 Supabase Connection Diagnostics', colors.bright);
  log('=====================================\n', colors.bright);

  const config = getConfig();

  // Display configuration
  log('📋 Configuration Found:', colors.cyan);
  log(`  Environment URL: ${config.envUrl || 'Not set'}`,
      config.envUrl ? colors.green : colors.yellow);
  log(`  Environment Key: ${config.envKey ? '***' + config.envKey.slice(-10) : 'Not set'}`,
      config.envKey ? colors.green : colors.yellow);
  log(`  File Project ID: ${config.fileProjectId || 'Not found'}`,
      config.fileProjectId ? colors.green : colors.red);
  log(`  Computed URL: ${config.computedUrl}`, colors.blue);

  // Check for mismatches
  if (config.envUrl && config.computedUrl && config.envUrl !== config.computedUrl) {
    log('\n⚠️  WARNING: URL Mismatch!', colors.yellow);
    log(`  .env URL: ${config.envUrl}`, colors.yellow);
    log(`  Computed: ${config.computedUrl}`, colors.yellow);
  }

  // Test connection to Supabase URL
  const testUrl = config.envUrl || config.computedUrl;
  log(`\n🌐 Testing connection to: ${testUrl}`, colors.cyan);

  const connectionResult = await testConnection(testUrl);

  if (connectionResult.error) {
    log(`  ❌ Connection failed: ${connectionResult.error}`, colors.red);
  } else if (connectionResult.statusCode === 404) {
    log(`  ❌ Status: ${connectionResult.statusCode} - Project not found`, colors.red);
    log('\n  Possible causes:', colors.yellow);
    log('  1. Supabase project was deleted or paused', colors.yellow);
    log('  2. Project ID is incorrect', colors.yellow);
    log('  3. Project URL has changed', colors.yellow);
  } else if (connectionResult.statusCode >= 200 && connectionResult.statusCode < 300) {
    log(`  ✅ Status: ${connectionResult.statusCode} - Connection successful`, colors.green);
  } else {
    log(`  ⚠️  Status: ${connectionResult.statusCode} - ${connectionResult.statusMessage}`, colors.yellow);
  }

  // Test Auth endpoint if we have a key
  if ((config.envKey || config.fileAnonKey) && connectionResult.statusCode !== 404) {
    log('\n🔐 Testing Auth endpoint...', colors.cyan);
    const authResult = await testAuthEndpoint(testUrl, config.envKey || config.fileAnonKey);

    if (authResult.error) {
      log(`  ❌ Auth test failed: ${authResult.error}`, colors.red);
    } else if (authResult.statusCode === 200) {
      log(`  ✅ Auth endpoint is healthy`, colors.green);
    } else {
      log(`  ⚠️  Auth status: ${authResult.statusCode}`, colors.yellow);
      if (authResult.body) {
        log(`  Response: ${authResult.body}`, colors.cyan);
      }
    }
  }

  // Provide recommendations
  log('\n📝 Recommendations:', colors.bright);

  if (connectionResult.statusCode === 404) {
    log('\n1. Create a new Supabase project:', colors.cyan);
    log('   - Go to https://supabase.com/dashboard', colors.blue);
    log('   - Create a new project', colors.blue);
    log('   - Copy the project URL and anon key', colors.blue);

    log('\n2. Update configuration:', colors.cyan);
    log('   - Update .env file with new VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY', colors.blue);
    log('   - Update src/utils/supabase/info.tsx with new projectId and publicAnonKey', colors.blue);

    log('\n3. Set environment variables in Vercel:', colors.cyan);
    log('   - Go to https://vercel.com/pubhub/pubhub/settings/environment-variables', colors.blue);
    log('   - Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY', colors.blue);
    log('   - Redeploy the application', colors.blue);
  } else if (config.envUrl && config.computedUrl && config.envUrl !== config.computedUrl) {
    log('\n1. Fix URL mismatch:', colors.cyan);
    log('   - Ensure .env and info.tsx use the same project', colors.blue);
    log('   - Update one to match the other', colors.blue);
  }

  log('\n🔧 Quick Fix Commands:', colors.bright);
  log('\n# Update local configuration:', colors.cyan);
  log('echo "VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co" > .env', colors.blue);
  log('echo "VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY" >> .env', colors.blue);

  log('\n# Update Vercel environment variables:', colors.cyan);
  log('vercel env add VITE_SUPABASE_URL production', colors.blue);
  log('vercel env add VITE_SUPABASE_ANON_KEY production', colors.blue);

  log('\n# Redeploy after fixing:', colors.cyan);
  log('vercel deploy --prod', colors.blue);

  // Check if this is likely a production issue
  if (process.env.NODE_ENV === 'production' || !fs.existsSync(path.join(__dirname, '..', '.env'))) {
    log('\n⚠️  Production Environment Detected', colors.yellow);
    log('Make sure environment variables are set in your hosting platform!', colors.yellow);
  }

  log('\n=====================================', colors.bright);
}

// Run diagnostics
runDiagnostics().catch(error => {
  log(`\n❌ Diagnostic error: ${error.message}`, colors.red);
  process.exit(1);
});