/**
 * Performance Monitoring Utilities for PubHub
 *
 * This module provides utilities for tracking custom performance marks,
 * measurements, and metrics to monitor application performance.
 */

import * as Sentry from '@sentry/react';

// Performance mark names for critical user flows
export const PERFORMANCE_MARKS = {
  // Page/Route Loading
  DASHBOARD_LOAD_START: 'dashboard-load-start',
  DASHBOARD_LOAD_END: 'dashboard-load-end',
  COMPOSE_LOAD_START: 'compose-load-start',
  COMPOSE_LOAD_END: 'compose-load-end',
  CALENDAR_LOAD_START: 'calendar-load-start',
  CALENDAR_LOAD_END: 'calendar-load-end',
  ANALYTICS_LOAD_START: 'analytics-load-start',
  ANALYTICS_LOAD_END: 'analytics-load-end',
  INBOX_LOAD_START: 'inbox-load-start',
  INBOX_LOAD_END: 'inbox-load-end',

  // Critical User Actions
  POST_COMPOSE_START: 'post-compose-start',
  POST_COMPOSE_END: 'post-compose-end',
  POST_PUBLISH_START: 'post-publish-start',
  POST_PUBLISH_END: 'post-publish-end',
  PLATFORM_CONNECT_START: 'platform-connect-start',
  PLATFORM_CONNECT_END: 'platform-connect-end',
  ANALYTICS_CALC_START: 'analytics-calculation-start',
  ANALYTICS_CALC_END: 'analytics-calculation-end',

  // Data Fetching
  SUPABASE_QUERY_START: 'supabase-query-start',
  SUPABASE_QUERY_END: 'supabase-query-end',
  API_REQUEST_START: 'api-request-start',
  API_REQUEST_END: 'api-request-end',

  // UI Rendering
  CALENDAR_RENDER_START: 'calendar-render-start',
  CALENDAR_RENDER_END: 'calendar-render-end',
  CHARTS_RENDER_START: 'charts-render-start',
  CHARTS_RENDER_END: 'charts-render-end',
} as const;

// Performance measurement names
export const PERFORMANCE_MEASURES = {
  DASHBOARD_LOAD: 'dashboard-load-time',
  COMPOSE_LOAD: 'compose-load-time',
  CALENDAR_LOAD: 'calendar-load-time',
  ANALYTICS_LOAD: 'analytics-load-time',
  INBOX_LOAD: 'inbox-load-time',
  POST_COMPOSE: 'post-compose-time',
  POST_PUBLISH: 'post-publish-time',
  PLATFORM_CONNECT: 'platform-connect-time',
  ANALYTICS_CALC: 'analytics-calculation-time',
  SUPABASE_QUERY: 'supabase-query-time',
  API_REQUEST: 'api-request-time',
  CALENDAR_RENDER: 'calendar-render-time',
  CHARTS_RENDER: 'charts-render-time',
} as const;

type PerformanceMarkName = typeof PERFORMANCE_MARKS[keyof typeof PERFORMANCE_MARKS];
type PerformanceMeasureName = typeof PERFORMANCE_MEASURES[keyof typeof PERFORMANCE_MEASURES];

/**
 * Mark the start of a performance measurement
 */
export function markStart(markName: PerformanceMarkName): void {
  try {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(markName);
    }
  } catch (error) {
    console.warn('Failed to create performance mark:', markName, error);
  }
}

/**
 * Mark the end of a performance measurement
 */
export function markEnd(markName: PerformanceMarkName): void {
  try {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(markName);
    }
  } catch (error) {
    console.warn('Failed to create performance mark:', markName, error);
  }
}

/**
 * Measure the time between two performance marks
 */
export function measure(
  measureName: PerformanceMeasureName,
  startMark: PerformanceMarkName,
  endMark: PerformanceMarkName
): number | null {
  try {
    if (typeof performance === 'undefined' || !performance.measure) {
      return null;
    }

    performance.measure(measureName, startMark, endMark);
    const entries = performance.getEntriesByName(measureName, 'measure');

    if (entries.length > 0) {
      const entry = entries[entries.length - 1];
      const duration = entry.duration;

      // Report to Sentry
      Sentry.metrics.distribution(measureName, duration, {
        unit: 'millisecond',
        tags: {
          measurement_type: 'custom',
        },
      });

      // Log in development
      if (import.meta.env.MODE === 'development') {
        console.log(`⚡ Performance: ${measureName} = ${duration.toFixed(2)}ms`);
      }

      // Clean up marks to avoid memory leaks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);

      return duration;
    }

    return null;
  } catch (error) {
    console.warn('Failed to measure performance:', measureName, error);
    return null;
  }
}

/**
 * Track a route/page load time
 */
export function trackRouteLoad(
  routeName: string,
  startMark: PerformanceMarkName,
  endMark: PerformanceMarkName
): void {
  const duration = measure(routeName as PerformanceMeasureName, startMark, endMark);

  if (duration !== null) {
    // Set performance target thresholds
    const thresholds = {
      good: 1000, // < 1s is good
      moderate: 2500, // 1-2.5s is moderate
      poor: Infinity, // > 2.5s is poor
    };

    const performance_rating =
      duration < thresholds.good ? 'good' :
      duration < thresholds.moderate ? 'moderate' :
      'poor';

    // Report as Sentry transaction
    Sentry.metrics.distribution('route.load.time', duration, {
      unit: 'millisecond',
      tags: {
        route: routeName,
        performance_rating,
      },
    });
  }
}

/**
 * Track an API request duration
 */
export function trackAPIRequest(
  endpoint: string,
  duration: number,
  success: boolean
): void {
  Sentry.metrics.distribution('api.request.duration', duration, {
    unit: 'millisecond',
    tags: {
      endpoint,
      success: success.toString(),
    },
  });
}

/**
 * Track a Supabase query duration
 */
export function trackSupabaseQuery(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  duration: number,
  success: boolean
): void {
  Sentry.metrics.distribution('supabase.query.duration', duration, {
    unit: 'millisecond',
    tags: {
      table,
      operation,
      success: success.toString(),
    },
  });
}

/**
 * Get the current memory usage (if available)
 */
export function getMemoryUsage(): { used: number; limit: number } | null {
  try {
    if ('memory' in performance && performance.memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }
  } catch (error) {
    console.warn('Failed to get memory usage:', error);
  }
  return null;
}

/**
 * Log memory usage (development only)
 */
export function logMemoryUsage(context: string): void {
  if (import.meta.env.MODE !== 'development') return;

  const memory = getMemoryUsage();
  if (memory) {
    const usedMB = (memory.used / 1024 / 1024).toFixed(2);
    const limitMB = (memory.limit / 1024 / 1024).toFixed(2);
    const percentage = ((memory.used / memory.limit) * 100).toFixed(1);
    console.log(`💾 Memory [${context}]: ${usedMB}MB / ${limitMB}MB (${percentage}%)`);
  }
}

/**
 * Helper to wrap async operations with performance tracking
 */
export async function measureAsync<T>(
  measureName: PerformanceMeasureName,
  startMark: PerformanceMarkName,
  endMark: PerformanceMarkName,
  operation: () => Promise<T>
): Promise<T> {
  markStart(startMark);
  try {
    const result = await operation();
    markEnd(endMark);
    measure(measureName, startMark, endMark);
    return result;
  } catch (error) {
    markEnd(endMark);
    measure(measureName, startMark, endMark);
    throw error;
  }
}

/**
 * Clear all performance marks and measures
 */
export function clearPerformanceData(): void {
  try {
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  } catch (error) {
    console.warn('Failed to clear performance data:', error);
  }
}

/**
 * Get all performance entries for debugging
 */
export function getPerformanceEntries(): PerformanceEntryList {
  try {
    if (typeof performance !== 'undefined' && performance.getEntries) {
      return performance.getEntries();
    }
  } catch (error) {
    console.warn('Failed to get performance entries:', error);
  }
  return [];
}
