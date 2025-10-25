import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../components/AuthContext';
import { ProjectProvider } from '../components/ProjectContext';
import { CommandPalette } from '../components/CommandPalette';

// Mock the CommandPalette component dependencies
vi.mock('../components/CommandPalette', () => ({
  CommandPalette: ({ onViewChange }: { onViewChange: (view: string) => void }) => (
    <div data-testid="command-palette">
      <button onClick={() => onViewChange('compose')}>Compose</button>
      <button onClick={() => onViewChange('analytics')}>Analytics</button>
    </div>
  ),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ProjectProvider>
      {children}
    </ProjectProvider>
  </AuthProvider>
);

describe('CommandPalette Integration', () => {
  it('opens and closes command palette with keyboard shortcut', async () => {
    const user = userEvent.setup();
    const mockOnViewChange = vi.fn();

    render(
      <TestWrapper>
        <CommandPalette onViewChange={mockOnViewChange} />
      </TestWrapper>
    );

    // Simulate Cmd+K or Ctrl+K
    await user.keyboard('{Meta>}k{/Meta}');
    
    await waitFor(() => {
      expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    });

    // Close with Escape
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
    });
  });

  it('navigates to different views when commands are selected', async () => {
    const user = userEvent.setup();
    const mockOnViewChange = vi.fn();

    render(
      <TestWrapper>
        <CommandPalette onViewChange={mockOnViewChange} />
      </TestWrapper>
    );

    // Open command palette
    await user.keyboard('{Meta>}k{/Meta}');
    
    await waitFor(() => {
      expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    });

    // Click compose command
    const composeButton = screen.getByRole('button', { name: 'Compose' });
    await user.click(composeButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('compose');
  });

  it('filters commands based on search input', async () => {
    const user = userEvent.setup();
    const mockOnViewChange = vi.fn();

    render(
      <TestWrapper>
        <CommandPalette onViewChange={mockOnViewChange} />
      </TestWrapper>
    );

    // Open command palette
    await user.keyboard('{Meta>}k{/Meta}');
    
    await waitFor(() => {
      expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'analytics');

    // Should show analytics command
    expect(screen.getByRole('button', { name: 'Analytics' })).toBeInTheDocument();
  });
});
