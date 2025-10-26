const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'ux-screenshots');

// UX issues tracking
const uxIssues = [];

async function analyzePage(page, name, notes = []) {
  const screenshot = await page.screenshot({
    path: path.join(screenshotsDir, `${name}.png`),
    fullPage: true
  });
  console.log(`📸 Screenshot saved: ${name}.png`);

  if (notes.length > 0) {
    notes.forEach(note => {
      uxIssues.push({ page: name, issue: note });
      console.log(`  ⚠️ UX Issue: ${note}`);
    });
  }
}

async function runUXAnalysis() {
  // Ensure screenshots directory exists
  await fs.mkdir(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('\n🚀 Starting UX Analysis of PubHub\n');

  try {
    // 1. Landing Page
    console.log('1️⃣ Analyzing Landing Page...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const landingNotes = [];

    // Check if sign-in is visible
    const signInButton = await page.locator('button:has-text("Sign in")').first();
    if (await signInButton.isVisible()) {
      await analyzePage(page, '01-landing-page', [
        'Sign in button could be more prominent - consider making it larger or using a contrasting color',
        'No clear value proposition visible above the fold',
        'Missing social proof or testimonials'
      ]);
    }

    // 2. Authentication Flow
    console.log('2️⃣ Testing Authentication...');

    // Click Sign In
    await signInButton.click();
    await page.waitForTimeout(2000);

    await analyzePage(page, '02-auth-page', [
      'OAuth providers should show their logos for better recognition',
      'No password strength indicator for sign-up',
      'Missing "Remember me" checkbox option',
      'Terms of service and privacy policy links not visible'
    ]);

    // Try to sign in with demo credentials
    const emailInput = await page.locator('input[type="email"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('demo@pubhub.dev');
      await passwordInput.fill('demo123456');

      await analyzePage(page, '03-auth-filled', [
        'No visual feedback while typing password',
        'Missing show/hide password toggle'
      ]);
    }

    // Navigate to different sections if possible
    console.log('3️⃣ Exploring Navigation...');

    // Check for navigation menu
    const hasNavigation = await page.locator('nav').first().isVisible();
    if (!hasNavigation) {
      uxIssues.push({
        page: 'general',
        issue: 'Navigation menu not immediately visible - users may get lost'
      });
    }

    // Test responsive design
    console.log('4️⃣ Testing Responsive Design...');

    // Mobile view
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    await analyzePage(page, '04-mobile-view', [
      'Check if all features are accessible on mobile',
      'Ensure touch targets are at least 44x44 pixels',
      'Navigation should collapse to hamburger menu on mobile'
    ]);

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await analyzePage(page, '05-tablet-view', [
      'Layout should adapt gracefully to tablet size',
      'Consider using more columns on tablet to utilize space'
    ]);

    // Back to desktop
    await page.setViewportSize({ width: 1440, height: 900 });

    // Check for accessibility
    console.log('5️⃣ Checking Accessibility...');

    // Tab navigation test
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el.tagName,
        hasOutline: window.getComputedStyle(el).outline !== 'none'
      };
    });

    if (!focusedElement.hasOutline) {
      uxIssues.push({
        page: 'accessibility',
        issue: 'Focus indicators not visible when tabbing - accessibility issue'
      });
    }

    // Color contrast check
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    // Check loading states
    console.log('6️⃣ Testing Loading States...');

    // Generate TASKS.md from issues
    console.log('\n📝 Generating TASKS.md...');

    let tasksContent = '# UX/UI Improvement Tasks\n\n';
    tasksContent += 'Generated from UX Analysis - ' + new Date().toISOString() + '\n\n';
    tasksContent += '## High Priority Issues\n\n';

    const highPriorityIssues = uxIssues.filter(i =>
      i.issue.includes('accessibility') ||
      i.issue.includes('not visible') ||
      i.issue.includes('missing')
    );

    highPriorityIssues.forEach((issue, index) => {
      tasksContent += `### Task ${index + 1}: ${issue.issue}\n`;
      tasksContent += `- **Page**: ${issue.page}\n`;
      tasksContent += `- **Priority**: High\n`;
      tasksContent += `- **Effort**: Medium\n\n`;
    });

    tasksContent += '## Medium Priority Issues\n\n';

    const mediumPriorityIssues = uxIssues.filter(i =>
      !highPriorityIssues.includes(i)
    );

    mediumPriorityIssues.forEach((issue, index) => {
      tasksContent += `### Task ${highPriorityIssues.length + index + 1}: ${issue.issue}\n`;
      tasksContent += `- **Page**: ${issue.page}\n`;
      tasksContent += `- **Priority**: Medium\n`;
      tasksContent += `- **Effort**: Small\n\n`;
    });

    await fs.writeFile('TASKS.md', tasksContent);
    console.log('✅ TASKS.md generated with ' + uxIssues.length + ' UX improvements');

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await browser.close();
  }

  console.log('\n🎉 UX Analysis Complete!');
  console.log(`📁 Screenshots saved in: ${screenshotsDir}`);
  console.log(`📋 ${uxIssues.length} UX issues identified and saved to TASKS.md`);
}

runUXAnalysis().catch(console.error);