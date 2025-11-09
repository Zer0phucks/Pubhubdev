import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Import mocks first to ensure localStorage is available
import './utils/mocks';

// TODO: Re-enable MSW server after fixing localStorage compatibility issue
// The MSW 2.x version has a bug where it requires localStorage at import time
// For now, we'll skip MSW to get basic tests running
// import { server } from './mocks/server';

// Mock fetch for tests that need it
global.fetch = vi.fn() as any;

// Start server before all tests
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any runtime request handlers we may add during the tests
// afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
// afterAll(() => server.close());
