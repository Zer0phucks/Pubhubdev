# Testing Guide

This document provides a comprehensive overview of the testing strategy and implementation for the PubHub Creator Dashboard.

## Testing Architecture

Our testing suite consists of three main layers:

### 1. Unit Tests (Vitest + React Testing Library)
- **Purpose**: Test individual components and utility functions in isolation
- **Location**: `src/test/components/` and `src/test/utils/`
- **Coverage**: Functions, components, hooks, and utility modules

### 2. Integration Tests (Vitest + React Testing Library)
- **Purpose**: Test component interactions and API integrations
- **Location**: `src/test/integration/`
- **Coverage**: Component workflows, API calls, state management

### 3. End-to-End Tests (Playwright)
- **Purpose**: Test complete user workflows across the application
- **Location**: `tests/e2e/`
- **Coverage**: Critical user journeys, cross-browser compatibility

### 4. Supabase Edge Function Tests (Deno)
- **Purpose**: Test server-side logic and API endpoints
- **Location**: `src/test/supabase/`
- **Coverage**: Authentication, data operations, file uploads

## Running Tests

### Unit and Integration Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

### All Tests
```bash
# Run unit tests and E2E tests
npm run test:all
```

## Test Structure

### Component Tests
Each component should have a corresponding test file that covers:

- **Rendering**: Component renders without errors
- **Props**: Different prop combinations work correctly
- **User Interactions**: Click handlers, form submissions, etc.
- **State Changes**: Component state updates appropriately
- **Accessibility**: ARIA attributes and keyboard navigation

Example:
```typescript
// src/test/components/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../components/ui/button';

describe('Button', () => {
  it('renders button with default variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests
Integration tests focus on component interactions and API calls:

- **Component Communication**: How components work together
- **API Integration**: Mock API calls and responses
- **State Management**: Context providers and state updates
- **Form Workflows**: Multi-step form interactions

Example:
```typescript
// src/test/integration/CommandPalette.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from '../components/CommandPalette';

describe('CommandPalette Integration', () => {
  it('opens and closes with keyboard shortcut', async () => {
    const user = userEvent.setup();
    const mockOnViewChange = vi.fn();

    render(<CommandPalette onViewChange={mockOnViewChange} />);

    // Simulate Cmd+K
    await user.keyboard('{Meta>}k{/Meta}');
    
    await waitFor(() => {
      expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests
End-to-end tests cover complete user workflows:

- **Authentication Flow**: Sign up, sign in, sign out
- **Content Creation**: Creating and publishing posts
- **Project Management**: Creating and managing projects
- **Platform Connections**: OAuth integration flows

Example:
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign up with email and password', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Sign Up');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Mocking Strategy

### API Mocking (MSW)
We use Mock Service Worker (MSW) to mock API calls:

```typescript
// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const supabaseHandlers = [
  http.post('*/auth/v1/signup', () => {
    return HttpResponse.json({
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: { access_token: 'mock-token' },
    });
  }),
];

export const server = setupServer(...supabaseHandlers);
```

### Component Mocking
Mock external dependencies and complex components:

```typescript
// src/test/utils/mocks.ts
import { vi } from 'vitest';

export const mockSupabaseClient = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    getSession: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
  })),
};
```

## Test Utilities

### Custom Render Function
We provide a custom render function with providers:

```typescript
// src/test/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { AuthProvider } from '../components/AuthContext';
import { ProjectProvider } from '../components/ProjectContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </AuthProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## Coverage Requirements

- **Unit Tests**: Minimum 80% line coverage
- **Integration Tests**: Cover all major user workflows
- **E2E Tests**: Cover critical user journeys
- **Edge Functions**: Test all API endpoints

## CI/CD Integration

Our GitHub Actions workflow runs:

1. **Unit Tests**: Fast feedback on code changes
2. **Integration Tests**: Verify component interactions
3. **E2E Tests**: Full application testing
4. **Supabase Tests**: Server-side function testing
5. **Linting**: Code quality checks
6. **Security Audit**: Dependency vulnerability scanning
7. **Build Test**: Verify production build

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: Each test should test one thing
4. **Mock External Dependencies**: Don't rely on external services
5. **Test User Behavior**: Focus on what users can do

### Test Data
1. **Use Factories**: Create test data consistently
2. **Minimal Data**: Use only necessary data for tests
3. **Realistic Data**: Make test data realistic
4. **Clean Up**: Clean up test data after each test

### Performance
1. **Parallel Execution**: Run tests in parallel when possible
2. **Fast Feedback**: Keep unit tests fast (< 100ms)
3. **Selective Running**: Run only relevant tests during development
4. **Mock Heavy Operations**: Mock file uploads, API calls, etc.

## Debugging Tests

### Unit Tests
```bash
# Run specific test file
npm run test Button.test.tsx

# Run tests matching pattern
npm run test -- --grep "renders button"

# Run tests in debug mode
npm run test -- --reporter=verbose
```

### E2E Tests
```bash
# Run specific test
npm run test:e2e -- --grep "Authentication Flow"

# Run in headed mode for debugging
npm run test:e2e:headed

# Generate trace for debugging
npm run test:e2e -- --trace on
```

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout for slow operations
2. **Flaky Tests**: Use `waitFor` for async operations
3. **Mock Issues**: Ensure mocks are properly reset between tests
4. **Environment Variables**: Set required env vars for tests

### Debug Commands
```bash
# Check test configuration
npm run test -- --help

# Run tests with debug output
DEBUG=vitest npm run test

# Check Playwright configuration
npx playwright test --list
```

## Contributing

When adding new features:

1. **Write Tests First**: Follow TDD when possible
2. **Update Mocks**: Add new API endpoints to MSW handlers
3. **Add E2E Tests**: Cover new user workflows
4. **Update Documentation**: Keep this guide current
5. **Check Coverage**: Ensure adequate test coverage

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
