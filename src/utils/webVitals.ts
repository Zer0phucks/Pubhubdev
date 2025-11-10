/**
 * Core Web Vitals Monitoring for PubHub
 *
 * Tracks and reports Core Web Vitals metrics to Sentry:
 * - LCP (Largest Contentful Paint) - Target: < 2.5s
 * - FID (First Input Delay) - Target: < 100ms
 * - CLS (Cumulative Layout Shift) - Target: < 0.1
 * - FCP (First Contentful Paint) - Target: < 1.8s
 * - TTFB (Time to First Byte) - Target: < 800ms
 * - INP (Interaction to Next Paint) - Target: < 200ms
 */

import * as Sentry from '@sentry/react';
import type { Metric } from 'web-vitals';

/**
 * Performance rating thresholds based on Google's recommendations
 */
const THRESHOLDS = {
  LCP: {
    good: 2500,
    moderate: 4000,
  },
  FID: {
    good: 100,
    moderate: 300,
  },
  CLS: {
    good: 0.1,
    moderate: 0.25,
  },
  FCP: {
    good: 1800,
    moderate: 3000,
  },
  TTFB: {
    good: 800,
    moderate: 1800,
  },
  INP: {
    good: 200,
    moderate: 500,
  },
} as const;

/**
 * Get performance rating based on metric value and thresholds
 */
function getPerformanceRating(
  metricName: keyof typeof THRESHOLDS,
  value: number
): 'good' | 'moderate' | 'poor' {
  const threshold = THRESHOLDS[metricName];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.moderate) return 'moderate';
  return 'poor';
}

/**
 * Send metric to Sentry with proper formatting
 */
function sendMetricToSentry(metric: Metric): void {
  const { name, value, rating, delta, id, navigationType } = metric;

  // Determine the rating if not provided
  const performanceRating = rating || getPerformanceRating(
    name as keyof typeof THRESHOLDS,
    value
  );

  // Report to Sentry as a distribution metric
  Sentry.metrics.distribution(`web-vitals.${name}`, value, {
    unit: name === 'CLS' ? 'ratio' : 'millisecond',
    tags: {
      rating: performanceRating,
      navigation_type: navigationType || 'unknown',
      metric_id: id,
    },
  });

  // Log in development for visibility
  if (import.meta.env.MODE === 'development') {
    const emoji = performanceRating === 'good' ? '✅' : performanceRating === 'moderate' ? '⚠️' : '❌';
    console.log(
      `${emoji} Web Vitals: ${name} = ${value.toFixed(2)}${name === 'CLS' ? '' : 'ms'} (${performanceRating})`
    );
  }

  // Set metric as a measurement on the active span
  // Note: getActiveTransaction() is deprecated in Sentry v8+
  // Measurements are now automatically added to the active span
  Sentry.setMeasurement(name, value, name === 'CLS' ? 'ratio' : 'millisecond');
  Sentry.setTag(`${name.toLowerCase()}_rating`, performanceRating);
}

/**
 * Initialize Core Web Vitals monitoring
 *
 * Call this function once during application initialization
 */
export async function initWebVitals(): Promise<void> {
  try {
    // Dynamically import web-vitals to avoid bundle bloat
    const { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } = await import('web-vitals');

    // Track Cumulative Layout Shift (CLS)
    // Target: < 0.1 (good), < 0.25 (moderate)
    onCLS(sendMetricToSentry);

    // Track First Input Delay (FID)
    // Target: < 100ms (good), < 300ms (moderate)
    onFID(sendMetricToSentry);

    // Track Largest Contentful Paint (LCP)
    // Target: < 2.5s (good), < 4s (moderate)
    onLCP(sendMetricToSentry);

    // Track First Contentful Paint (FCP)
    // Target: < 1.8s (good), < 3s (moderate)
    onFCP(sendMetricToSentry);

    // Track Time to First Byte (TTFB)
    // Target: < 800ms (good), < 1.8s (moderate)
    onTTFB(sendMetricToSentry);

    // Track Interaction to Next Paint (INP)
    // Target: < 200ms (good), < 500ms (moderate)
    onINP(sendMetricToSentry);

    if (import.meta.env.MODE === 'development') {
      console.log('📊 Core Web Vitals monitoring initialized');
    }
  } catch (error) {
    console.error('Failed to initialize Web Vitals monitoring:', error);
    Sentry.captureException(error, {
      tags: {
        component: 'web-vitals',
        action: 'initialization',
      },
    });
  }
}

/**
 * Report custom performance metrics alongside Web Vitals
 */
export function reportCustomMetric(
  name: string,
  value: number,
  unit: 'millisecond' | 'second' | 'ratio' = 'millisecond',
  tags?: Record<string, string>
): void {
  Sentry.metrics.distribution(`custom.${name}`, value, {
    unit,
    tags: {
      ...tags,
      metric_type: 'custom',
    },
  });

  if (import.meta.env.MODE === 'development') {
    console.log(`📈 Custom Metric: ${name} = ${value}${unit === 'ratio' ? '' : unit === 'second' ? 's' : 'ms'}`);
  }
}

/**
 * Get a summary of current Web Vitals (for debugging)
 */
export async function getWebVitalsSummary(): Promise<Record<string, number>> {
  try {
    const { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } = await import('web-vitals');

    const summary: Record<string, number> = {};

    return new Promise((resolve) => {
      let collected = 0;
      const total = 6;

      const checkComplete = () => {
        collected++;
        if (collected === total) {
          resolve(summary);
        }
      };

      onCLS((metric) => { summary.CLS = metric.value; checkComplete(); }, { reportAllChanges: true });
      onFID((metric) => { summary.FID = metric.value; checkComplete(); }, { reportAllChanges: true });
      onLCP((metric) => { summary.LCP = metric.value; checkComplete(); }, { reportAllChanges: true });
      onFCP((metric) => { summary.FCP = metric.value; checkComplete(); }, { reportAllChanges: true });
      onTTFB((metric) => { summary.TTFB = metric.value; checkComplete(); }, { reportAllChanges: true });
      onINP((metric) => { summary.INP = metric.value; checkComplete(); }, { reportAllChanges: true });

      // Timeout after 5 seconds
      setTimeout(() => resolve(summary), 5000);
    });
  } catch (error) {
    console.error('Failed to get Web Vitals summary:', error);
    return {};
  }
}

/**
 * Check if Web Vitals meet performance budgets
 */
export async function checkPerformanceBudgets(): Promise<{
  passed: boolean;
  violations: Array<{ metric: string; value: number; threshold: number }>;
}> {
  const summary = await getWebVitalsSummary();
  const violations: Array<{ metric: string; value: number; threshold: number }> = [];

  // Check each metric against "good" thresholds
  Object.entries(summary).forEach(([metric, value]) => {
    const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS];
    if (threshold && value > threshold.good) {
      violations.push({
        metric,
        value,
        threshold: threshold.good,
      });
    }
  });

  return {
    passed: violations.length === 0,
    violations,
  };
}

// Expose utilities to window for debugging (development only)
if (import.meta.env.MODE === 'development') {
  (window as any).webVitals = {
    getSummary: getWebVitalsSummary,
    checkBudgets: checkPerformanceBudgets,
    reportCustomMetric,
  };
}
