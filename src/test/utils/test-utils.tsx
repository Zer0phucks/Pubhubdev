import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { AuthProvider } from '../components/AuthContext';
import { ProjectProvider } from '../components/ProjectContext';

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

// Mock project data
export const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  description: 'A test project',
  created_at: new Date().toISOString(),
  user_id: 'test-user-id',
};

// Custom render function with providers
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
