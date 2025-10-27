# Sentry Configuration for Vite + React

This project uses Sentry for error tracking and performance monitoring with Vite and React.

## Environment Variables

Add these environment variables to your `.env` file:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Optional: Enable Sentry in development
VITE_SENTRY_DEBUG=false
```

## Vercel Environment Variables

For production deployment on Vercel, add these environment variables in your Vercel dashboard:

1. `VITE_SENTRY_DSN` - Your Sentry DSN
2. `SENTRY_ORG` - Your Sentry organization slug
3. `SENTRY_PROJECT` - Your Sentry project slug
4. `SENTRY_AUTH_TOKEN` - Your Sentry auth token for source map uploads

## Features

- **Error Tracking**: Captures JavaScript errors and unhandled promise rejections
- **Performance Monitoring**: Tracks page load times and user interactions
- **Session Replay**: Records user sessions for debugging (configurable)
- **Source Maps**: Automatically uploads source maps for better error tracking
- **Environment-based Configuration**: Different settings for development and production

## Configuration

The Sentry configuration is in `src/sentry.ts` and can be customized based on your needs:

- **Sample Rates**: Automatically adjusted based on environment
- **Privacy**: Text and media masking can be configured
- **Debug Mode**: Can be enabled in development with `VITE_SENTRY_DEBUG=true`

## Usage

Sentry is automatically initialized when the app starts. You can also manually capture events:

```typescript
import * as Sentry from '@sentry/react';

// Capture an exception
Sentry.captureException(new Error('Something went wrong'));

// Capture a message
Sentry.captureMessage('Something happened', 'info');

// Add user context
Sentry.setUser({ id: '123', email: 'user@example.com' });
```

## Build Process

The Vite plugin automatically:
- Uploads source maps to Sentry during build
- Configures the correct release information
- Handles source map associations

Make sure to set the `SENTRY_AUTH_TOKEN` environment variable for source map uploads to work.
