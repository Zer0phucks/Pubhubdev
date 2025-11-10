import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Axe-core accessibility testing setup
 * Extends Playwright test with accessibility scanning capabilities
 */

export type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<AxeFixture>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('#webpack-dev-server-client-overlay');
    await use(makeAxeBuilder);
  },
});

export { expect } from '@playwright/test';

/**
 * Helper function to format axe violations for readable output
 */
export function formatViolations(violations: any[]) {
  if (violations.length === 0) {
    return 'No accessibility violations found!';
  }

  const formatted = violations.map((violation) => {
    const nodeInfo = violation.nodes
      .map((node: any) => {
        return `    Target: ${node.target.join(', ')}\n    ${node.failureSummary}`;
      })
      .join('\n\n');

    return `
  [${violation.impact.toUpperCase()}] ${violation.id}
  Description: ${violation.description}
  Help: ${violation.help}
  Help URL: ${violation.helpUrl}
  Affected Elements (${violation.nodes.length}):
${nodeInfo}
    `;
  });

  return formatted.join('\n' + '='.repeat(80) + '\n');
}

/**
 * Categorize violations by severity
 */
export function categorizeViolations(violations: any[]) {
  const categorized = {
    critical: [] as any[],
    serious: [] as any[],
    moderate: [] as any[],
    minor: [] as any[],
  };

  violations.forEach((violation) => {
    const impact = violation.impact;
    if (impact === 'critical') {
      categorized.critical.push(violation);
    } else if (impact === 'serious') {
      categorized.serious.push(violation);
    } else if (impact === 'moderate') {
      categorized.moderate.push(violation);
    } else if (impact === 'minor') {
      categorized.minor.push(violation);
    }
  });

  return categorized;
}

/**
 * Generate summary report
 */
export function generateSummary(violations: any[]) {
  const categorized = categorizeViolations(violations);
  const total = violations.length;
  const criticalCount = categorized.critical.length;
  const seriousCount = categorized.serious.length;
  const moderateCount = categorized.moderate.length;
  const minorCount = categorized.minor.length;

  return `
Accessibility Violations Summary:
==================================
Total Violations: ${total}
  Critical: ${criticalCount}
  Serious: ${seriousCount}
  Moderate: ${moderateCount}
  Minor: ${minorCount}

${criticalCount > 0 ? '⚠️  CRITICAL issues require immediate attention!' : ''}
${seriousCount > 0 ? '⚠️  SERIOUS issues should be addressed soon.' : ''}
${total === 0 ? '✅ No accessibility violations found!' : ''}
  `;
}
