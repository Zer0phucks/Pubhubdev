import * as Sentry from '@sentry/react';
import { Button } from './ui/button';

/**
 * Test component to verify Sentry error tracking is working
 * Add this temporarily to your app to test error reporting
 *
 * Usage:
 * import { SentryTestButton } from './components/SentryTestButton';
 * <SentryTestButton />
 */
export function SentryTestButton() {
  const testError = () => {
    throw new Error('Sentry Test Error - This is a test to verify error tracking is working');
  };

  const testMessage = () => {
    Sentry.captureMessage('Sentry Test Message - This is a test message', 'info');
    alert('Test message sent to Sentry! Check your Sentry dashboard.');
  };

  return (
    <div className="flex gap-2 p-4 border rounded-lg bg-gray-50">
      <Button
        onClick={testError}
        variant="destructive"
        size="sm"
      >
        Test Error Tracking
      </Button>
      <Button
        onClick={testMessage}
        variant="outline"
        size="sm"
      >
        Test Message Capture
      </Button>
      <p className="text-sm text-gray-600 my-auto">
        Test Sentry integration (remove after testing)
      </p>
    </div>
  );
}
