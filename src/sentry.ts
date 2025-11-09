import * as Sentry from '@sentry/react';
import { createBrowserRouter } from 'react-router-dom';

/**
 * Enhanced Sentry Configuration with Performance Monitoring
 *
 * Features:
 * - Browser tracing for navigation and user interactions
 * - Session replay for error reproduction
 * - Performance profiling
 * - Custom performance metrics
 * - Core Web Vitals monitoring
 */

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,

  integrations: [
    // Browser tracing with enhanced React Router integration
    Sentry.browserTracingIntegration({
      // Enable automatic route change tracking
      routingInstrumentation: Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect: (window as any).React?.useEffect,
        useLocation: (window as any).ReactRouterDOM?.useLocation,
        useNavigationType: (window as any).ReactRouterDOM?.useNavigationType,
        createRoutesFromChildren: (window as any).ReactRouterDOM?.createRoutesFromChildren,
        matchRoutes: (window as any).ReactRouterDOM?.matchRoutes,
      }),

      // Track user interactions
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/pubhub\.dev/,
        /^https:\/\/.*\.vercel\.app/,
      ],

      // Enable long task tracking
      enableLongTask: true,

      // Track fetch and XHR requests
      traceFetch: true,
      traceXHR: true,

      // Mark important interactions
      markBackgroundTransactions: true,

      // Performance thresholds
      idleTimeout: 1000,
      finalTimeout: 30000,
    }),

    // Session replay for debugging
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      // Record network requests for performance debugging
      networkDetailAllowUrls: [
        'localhost',
        /^https:\/\/pubhub\.dev/,
        /^https:\/\/.*\.supabase\.co/,
      ],
      // Capture console logs
      networkCaptureBodies: true,
      // Include breadcrumbs for performance events
      includePerformanceEvents: true,
    }),

    // React-specific error boundary integration
    Sentry.reactErrorBoundaryIntegration({
      showDialog: false,
      fallback: ({ error, resetError }) => (
        window as any).React?.createElement('div', {
          className: 'error-boundary-fallback',
          children: 'An error occurred. Please refresh the page.',
        }),
    }),

    // Enable HTTP Client integration for API monitoring
    Sentry.httpClientIntegration(),
  ],

  // Performance Monitoring - Higher sample rates for better visibility
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.3 : 1.0,

  // Session Replay - Capture more sessions in production for performance analysis
  replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.2 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Profiling - Capture profiles for performance optimization
  profilesSampleRate: import.meta.env.MODE === 'production' ? 0.3 : 1.0,

  // Enable metric aggregation for custom performance metrics
  enableMetrics: true,

  // Capture unhandled promise rejections
  captureUnhandledRejections: true,

  // Capture uncaught exceptions
  captureUncaughtException: true,

  // Transaction naming for better organization
  beforeSendTransaction(event) {
    // Enhance transaction names for better categorization
    if (event.transaction) {
      // Clean up dynamic route parameters
      event.transaction = event.transaction.replace(/\/\d+/g, '/:id');

      // Add custom tags for filtering
      if (event.transaction.includes('/dashboard')) {
        event.tags = { ...event.tags, page_type: 'dashboard' };
      } else if (event.transaction.includes('/compose')) {
        event.tags = { ...event.tags, page_type: 'compose' };
      } else if (event.transaction.includes('/calendar')) {
        event.tags = { ...event.tags, page_type: 'calendar' };
      } else if (event.transaction.includes('/analytics')) {
        event.tags = { ...event.tags, page_type: 'analytics' };
      }
    }

    return event;
  },

  // Event filtering and enhancement
  beforeSend(event) {
    // Don't send events in development unless explicitly enabled
    if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SENTRY_DEBUG) {
      return null;
    }

    // Add performance context to error events
    if (typeof performance !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        event.contexts = {
          ...event.contexts,
          performance: {
            dns_time: navigation.domainLookupEnd - navigation.domainLookupStart,
            connection_time: navigation.connectEnd - navigation.connectStart,
            request_time: navigation.responseEnd - navigation.requestStart,
            dom_interactive: navigation.domInteractive,
            dom_complete: navigation.domComplete,
            load_time: navigation.loadEventEnd - navigation.loadEventStart,
          },
        };
      }
    }

    return event;
  },

  // Ignore common non-actionable errors
  ignoreErrors: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,

    // Network errors that are expected
    'NetworkError',
    'Failed to fetch',
    'Network request failed',

    // ResizeObserver loop errors (common, non-actionable)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],
});

// Expose Sentry globally for testing in console (development only)
if (import.meta.env.MODE === 'development') {
  (window as any).Sentry = Sentry;
}

export default Sentry;
