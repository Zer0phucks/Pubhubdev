import { test, expect, formatViolations, generateSummary } from './axe-setup';
import fs from 'fs';
import path from 'path';

/**
 * Comprehensive accessibility test suite for PubHub
 * Tests all major pages for WCAG 2.1 Level AA compliance
 */

test.describe('Accessibility Tests - WCAG 2.1 Level AA', () => {
  // Test configuration
  const pages = [
    { name: 'Landing Page', url: '/', waitFor: 'h1' },
    { name: 'Auth Page', url: '/auth', waitFor: 'form' },
    { name: 'Dashboard', url: '/dashboard', waitFor: '[role="main"]', requiresAuth: true },
    { name: 'Compose', url: '/compose', waitFor: 'textarea', requiresAuth: true },
    { name: 'Inbox', url: '/inbox', waitFor: '[role="main"]', requiresAuth: true },
    { name: 'Calendar', url: '/calendar', waitFor: '[role="main"]', requiresAuth: true },
    { name: 'Analytics', url: '/analytics', waitFor: '[role="main"]', requiresAuth: true },
  ];

  let allViolations: any[] = [];

  test.beforeAll(async () => {
    // Clear previous report
    allViolations = [];
  });

  test.afterAll(async () => {
    // Generate comprehensive report
    const reportDir = path.join(process.cwd(), 'test-results', 'accessibility');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'accessibility-report.txt');
    const summary = generateSummary(allViolations);
    const details = formatViolations(allViolations);
    const fullReport = `${summary}\n\n${'='.repeat(80)}\nDetailed Violations:\n${'='.repeat(80)}\n${details}`;

    fs.writeFileSync(reportPath, fullReport);
    console.log(`\nAccessibility report generated: ${reportPath}`);
    console.log(summary);
  });

  for (const page of pages) {
    test(`${page.name} should have no accessibility violations`, async ({ page: browserPage, makeAxeBuilder }) => {
      // Skip auth-required pages if not logged in
      if (page.requiresAuth) {
        test.skip(!process.env.TEST_USER_EMAIL, 'Auth required - set TEST_USER_EMAIL to run this test');
      }

      // Navigate to page
      await browserPage.goto(page.url);

      // Wait for content to load
      try {
        await browserPage.waitForSelector(page.waitFor, { timeout: 10000 });
      } catch (error) {
        console.warn(`Selector ${page.waitFor} not found on ${page.name}, continuing anyway...`);
      }

      // Run accessibility scan
      const accessibilityScanResults = await makeAxeBuilder().analyze();

      // Store violations for report
      if (accessibilityScanResults.violations.length > 0) {
        const pageViolations = accessibilityScanResults.violations.map(v => ({
          ...v,
          page: page.name,
        }));
        allViolations.push(...pageViolations);
      }

      // Log violations for this page
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`\n${page.name} - Violations Found:`);
        console.log(formatViolations(accessibilityScanResults.violations));
      }

      // Assert no violations
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  test('Color contrast should meet WCAG AA standards', async ({ page, makeAxeBuilder }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    const accessibilityScanResults = await makeAxeBuilder()
      .withRules(['color-contrast'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\nColor Contrast Violations:');
      console.log(formatViolations(accessibilityScanResults.violations));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Form elements should have proper labels', async ({ page, makeAxeBuilder }) => {
    await page.goto('/auth');
    await page.waitForSelector('form');

    const accessibilityScanResults = await makeAxeBuilder()
      .withRules(['label', 'label-content-name-mismatch'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\nForm Label Violations:');
      console.log(formatViolations(accessibilityScanResults.violations));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Images should have alt text', async ({ page, makeAxeBuilder }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    const accessibilityScanResults = await makeAxeBuilder()
      .withRules(['image-alt'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\nImage Alt Text Violations:');
      console.log(formatViolations(accessibilityScanResults.violations));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Heading hierarchy should be logical', async ({ page, makeAxeBuilder }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    const accessibilityScanResults = await makeAxeBuilder()
      .withRules(['heading-order'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\nHeading Hierarchy Violations:');
      console.log(formatViolations(accessibilityScanResults.violations));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Landmark roles should be present', async ({ page, makeAxeBuilder }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    const accessibilityScanResults = await makeAxeBuilder()
      .withRules(['region', 'landmark-one-main'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\nLandmark Role Violations:');
      console.log(formatViolations(accessibilityScanResults.violations));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('ARIA attributes should be valid', async ({ page, makeAxeBuilder }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    const accessibilityScanResults = await makeAxeBuilder()
      .withRules([
        'aria-valid-attr',
        'aria-valid-attr-value',
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
      ])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\nARIA Violations:');
      console.log(formatViolations(accessibilityScanResults.violations));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Interactive elements should be keyboard accessible', async ({ page, makeAxeBuilder }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    const accessibilityScanResults = await makeAxeBuilder()
      .withRules(['button-name', 'link-name'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\nKeyboard Accessibility Violations:');
      console.log(formatViolations(accessibilityScanResults.violations));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
