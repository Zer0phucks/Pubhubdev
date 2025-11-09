/**
 * Centralized logging utility for PubHub
 * Replaces direct console usage with environment-aware logging
 * and Sentry integration for production errors
 */

import * as Sentry from '@sentry/react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;
  }

  /**
   * Debug-level logging (development only)
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Info-level logging (development only)
   * Use for general informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  /**
   * Warning-level logging
   * Logs to console in dev, sends to Sentry in production
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    }

    if (this.isProduction) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      });
    }
  }

  /**
   * Error-level logging
   * Logs to console in dev, sends to Sentry in production
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '', context || '');
    }

    if (this.isProduction) {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: {
            message,
            ...context,
          },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: {
            error,
            ...context,
          },
        });
      }
    }
  }

  /**
   * Performance measurement logging
   * Useful for tracking slow operations
   */
  perf(label: string, startTime: number, context?: LogContext): void {
    const duration = performance.now() - startTime;

    if (this.isDevelopment) {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`, context || '');
    }

    if (this.isProduction && duration > 1000) {
      // Only log slow operations in production
      Sentry.captureMessage(`Slow operation: ${label}`, {
        level: 'warning',
        extra: {
          duration,
          ...context,
        },
      });
    }
  }

  /**
   * API request logging
   * Tracks API calls for debugging
   */
  api(method: string, url: string, status?: number, duration?: number): void {
    if (this.isDevelopment) {
      const statusText = status ? `[${status}]` : '';
      const durationText = duration ? `${duration.toFixed(0)}ms` : '';
      console.log(`[API] ${method} ${url} ${statusText} ${durationText}`);
    }

    if (this.isProduction && status && status >= 400) {
      Sentry.captureMessage(`API Error: ${method} ${url}`, {
        level: status >= 500 ? 'error' : 'warning',
        extra: {
          method,
          url,
          status,
          duration,
        },
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const { debug, info, warn, error, perf, api } = logger;
