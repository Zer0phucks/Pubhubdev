import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  // Session Replay
  replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  // Set sample rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  // Capture unhandled promise rejections
  captureUnhandledRejections: true,
  // Capture uncaught exceptions
  captureUncaughtException: true,
  // Set user context
  beforeSend(event) {
    // Don't send events in development unless explicitly enabled
    if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SENTRY_DEBUG) {
      return null;
    }
    return event;
  },
});

// Expose Sentry globally for testing in console (development only)
if (import.meta.env.MODE === 'development') {
  (window as any).Sentry = Sentry;
}

export default Sentry;
