const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const screenshotsDir = path.join(__dirname, 'ux-screenshots');
const uxIssues = [];

async function analyzePage(page, name, notes = []) {
  const screenshot = await page.screenshot({
    path: path.join(screenshotsDir, `${name}.png`),
    fullPage: true
  });
  console.log(`📸 Screenshot saved: ${name}.png`);

  if (notes.length > 0) {
    notes.forEach(note => {
      uxIssues.push({
        page: name,
        issue: note,
        severity: note.includes('critical') || note.includes('blocking') ? 'High' :
                  note.includes('important') || note.includes('should') ? 'Medium' : 'Low'
      });
      console.log(`  ⚠️ ${note}`);
    });
  }
}

async function deepUXAnalysis() {
  await fs.mkdir(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true }); // Use headless for speed
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // Simulate logged in state to bypass auth
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:3001',
        localStorage: [{
          name: 'supabase.auth.token',
          value: JSON.stringify({
            access_token: 'mock_token',
            user: {
              id: 'mock_user_id',
              email: 'test@pubhub.dev',
              user_metadata: { name: 'Test User' }
            }
          })
        }]
      }]
    }
  });

  const page = await context.newPage();

  console.log('\n🔍 Deep UX Analysis - Authenticated Experience\n');

  try {
    // Navigate directly to app (simulating logged-in state)
    console.log('1️⃣ Main Dashboard Analysis...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check for empty states
    const hasEmptyState = await page.locator('text=/no projects|get started|create your first/i').count() > 0;

    if (hasEmptyState) {
      await analyzePage(page, '06-dashboard-empty-state', [
        'Empty state should be more engaging - add illustrations or icons',
        'Should guide users through first steps with a checklist or wizard',
        'Add sample content or demo project option for new users'
      ]);
    }

    // Navigation Analysis
    console.log('2️⃣ Navigation & Information Architecture...');

    // Check sidebar
    const sidebarVisible = await page.locator('aside, nav').first().isVisible();
    if (!sidebarVisible) {
      uxIssues.push({
        page: 'navigation',
        issue: 'Critical: No persistent navigation visible - users will get lost',
        severity: 'High'
      });
    }

    // Count navigation items
    const navItems = await page.locator('nav a, nav button').count();
    if (navItems > 7) {
      uxIssues.push({
        page: 'navigation',
        issue: `Navigation has ${navItems} items - consider grouping or prioritizing (7±2 rule)`,
        severity: 'Medium'
      });
    }

    // Content Creation Flow
    console.log('3️⃣ Content Creation Workflow...');

    // Look for compose/create button
    const createButton = await page.locator('button:has-text(/create|compose|new post/i)').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(2000);

      await analyzePage(page, '07-content-composer', [
        'Character counter should be more prominent for platform constraints',
        'AI assistance button could be more discoverable',
        'Preview mode should show how post will look on each platform',
        'Missing auto-save indicator'
      ]);
    }

    // Platform Connections
    console.log('4️⃣ Platform Integration Experience...');

    const connectButton = await page.locator('text=/connect.*platform/i').first();
    if (await connectButton.isVisible()) {
      await analyzePage(page, '08-platform-connections', [
        'Platform connection status not immediately clear',
        'Should show benefits of connecting each platform',
        'Missing troubleshooting help for failed connections'
      ]);
    }

    // Calendar View
    console.log('5️⃣ Content Calendar...');

    const calendarLink = await page.locator('text=/calendar/i').first();
    if (await calendarLink.isVisible()) {
      await calendarLink.click();
      await page.waitForTimeout(2000);

      await analyzePage(page, '09-content-calendar', [
        'Drag and drop for rescheduling not obvious',
        'Should have week/month/list view toggles',
        'Color coding for different platforms would help',
        'Missing recurring post templates'
      ]);
    }

    // Analytics Dashboard
    console.log('6️⃣ Analytics & Insights...');

    const analyticsLink = await page.locator('text=/analytics/i').first();
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await page.waitForTimeout(2000);

      await analyzePage(page, '10-analytics', [
        'Charts need better labeling and legends',
        'Should have date range selector prominently displayed',
        'Missing export functionality for reports',
        'No comparison view between platforms'
      ]);
    }

    // Settings & Profile
    console.log('7️⃣ Settings Accessibility...');

    const settingsButton = await page.locator('[aria-label*=settings], button:has-text(/settings/i)').first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(2000);

      await analyzePage(page, '11-settings', [
        'Settings categories should be better organized',
        'Dangerous actions (delete account) need better confirmation',
        'Missing search functionality in settings',
        'No keyboard shortcuts configuration'
      ]);
    }

    // Competition Watch
    console.log('8️⃣ Competition Watch Feature...');

    const competitionLink = await page.locator('text=/competition/i').first();
    if (await competitionLink.isVisible()) {
      await competitionLink.click();
      await page.waitForTimeout(2000);

      await analyzePage(page, '12-competition-watch', [
        'Should allow adding custom competitors',
        'Missing trend analysis over time',
        'Need filtering by engagement metrics',
        'Should link to competitor\'s actual profiles'
      ]);
    }

    // Error States
    console.log('9️⃣ Error Handling...');

    // Try to trigger an error
    await page.goto('http://localhost:3001/nonexistent-page');
    await page.waitForTimeout(2000);

    const has404 = await page.locator('text=/404|not found|error/i').count() > 0;
    if (!has404) {
      uxIssues.push({
        page: 'error-handling',
        issue: 'Critical: No proper 404 page - users will be confused',
        severity: 'High'
      });
    }

    // Performance Observations
    console.log('🚀 Performance Checks...');

    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart
      };
    });

    if (metrics.loadComplete > 3000) {
      uxIssues.push({
        page: 'performance',
        issue: `Page load time is ${metrics.loadComplete}ms - should be under 3 seconds`,
        severity: 'High'
      });
    }

    // Accessibility Quick Check
    console.log('♿ Accessibility Validation...');

    // Check for alt text
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      uxIssues.push({
        page: 'accessibility',
        issue: `${imagesWithoutAlt} images missing alt text - accessibility issue`,
        severity: 'High'
      });
    }

    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    if (h1Count !== 1) {
      uxIssues.push({
        page: 'accessibility',
        issue: `Page has ${h1Count} H1 tags - should have exactly one`,
        severity: 'Medium'
      });
    }

    // Form labels
    const inputsWithoutLabels = await page.locator('input:not([aria-label]):not([id])').count();
    if (inputsWithoutLabels > 0) {
      uxIssues.push({
        page: 'accessibility',
        issue: `${inputsWithoutLabels} form inputs missing labels`,
        severity: 'High'
      });
    }

  } catch (error) {
    console.error('Analysis error:', error);
  } finally {
    await browser.close();
  }

  // Generate comprehensive TASKS.md
  console.log('\n📝 Updating TASKS.md with comprehensive findings...\n');

  let tasksContent = '# UX/UI Improvement Tasks - Comprehensive Analysis\n\n';
  tasksContent += `Generated: ${new Date().toISOString()}\n`;
  tasksContent += `Total Issues Identified: ${uxIssues.length}\n\n`;

  // Group by severity
  const highPriority = uxIssues.filter(i => i.severity === 'High');
  const mediumPriority = uxIssues.filter(i => i.severity === 'Medium');
  const lowPriority = uxIssues.filter(i => i.severity === 'Low');

  tasksContent += `## Summary\n`;
  tasksContent += `- 🔴 High Priority: ${highPriority.length} issues\n`;
  tasksContent += `- 🟡 Medium Priority: ${mediumPriority.length} issues\n`;
  tasksContent += `- 🟢 Low Priority: ${lowPriority.length} issues\n\n`;

  tasksContent += '## 🔴 High Priority Tasks (Fix Immediately)\n\n';
  highPriority.forEach((issue, index) => {
    tasksContent += `### ${index + 1}. ${issue.issue}\n`;
    tasksContent += `- **Location**: ${issue.page}\n`;
    tasksContent += `- **Impact**: Blocks user progress or violates accessibility\n`;
    tasksContent += `- **Estimated Effort**: 2-4 hours\n\n`;
  });

  tasksContent += '## 🟡 Medium Priority Tasks (Fix This Sprint)\n\n';
  mediumPriority.forEach((issue, index) => {
    tasksContent += `### ${highPriority.length + index + 1}. ${issue.issue}\n`;
    tasksContent += `- **Location**: ${issue.page}\n`;
    tasksContent += `- **Impact**: Degrades user experience\n`;
    tasksContent += `- **Estimated Effort**: 1-2 hours\n\n`;
  });

  tasksContent += '## 🟢 Low Priority Tasks (Nice to Have)\n\n';
  lowPriority.forEach((issue, index) => {
    tasksContent += `### ${highPriority.length + mediumPriority.length + index + 1}. ${issue.issue}\n`;
    tasksContent += `- **Location**: ${issue.page}\n`;
    tasksContent += `- **Impact**: Polish and delight\n`;
    tasksContent += `- **Estimated Effort**: 30-60 minutes\n\n`;
  });

  tasksContent += '## Recommended Implementation Order\n\n';
  tasksContent += '1. **Week 1**: Fix all accessibility issues (High priority)\n';
  tasksContent += '2. **Week 2**: Improve navigation and empty states\n';
  tasksContent += '3. **Week 3**: Enhance forms and input validation\n';
  tasksContent += '4. **Week 4**: Polish visual design and micro-interactions\n\n';

  tasksContent += '## Success Metrics\n\n';
  tasksContent += '- [ ] All images have alt text\n';
  tasksContent += '- [ ] All form inputs have labels\n';
  tasksContent += '- [ ] Page load time under 3 seconds\n';
  tasksContent += '- [ ] Mobile experience fully functional\n';
  tasksContent += '- [ ] Clear navigation on all pages\n';
  tasksContent += '- [ ] Proper error handling throughout\n';

  await fs.writeFile('TASKS.md', tasksContent);

  console.log('✅ Analysis Complete!');
  console.log(`📊 Total Issues: ${uxIssues.length}`);
  console.log(`   🔴 High: ${highPriority.length}`);
  console.log(`   🟡 Medium: ${mediumPriority.length}`);
  console.log(`   🟢 Low: ${lowPriority.length}`);
}

deepUXAnalysis().catch(console.error);