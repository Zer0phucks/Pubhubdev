/**
 * Project API utilities
 * Handles project CRUD operations and management
 */

import { apiCall } from './api';
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types';

/**
 * Fetch all projects for the current user
 */
export async function fetchProjects(): Promise<Project[]> {
  try {
    const response = await apiCall('/projects');
    return response.projects || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

/**
 * Fetch a single project by ID
 */
export async function fetchProject(id: string): Promise<Project | null> {
  try {
    const projects = await fetchProjects();
    return projects.find((p) => p.id === id) || null;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
}

/**
 * Create a new project
 */
export async function createProject(project: CreateProjectInput): Promise<Project> {
  try {
    const response = await apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
    return response.project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  updates: UpdateProjectInput
): Promise<Project> {
  try {
    const response = await apiCall(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.project;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

/**
 * Delete a project (CASCADE deletes all related data)
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    await apiCall(`/projects/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

/**
 * Get project with all related data (brand, persona, content sources)
 */
export async function fetchProjectWithDetails(id: string): Promise<{
  project: Project;
  brand: any | null;
  persona: any | null;
  contentSourceCount: number;
}> {
  try {
    // Fetch project
    const project = await fetchProject(id);
    if (!project) {
      throw new Error('Project not found');
    }

    // Fetch brand and persona using their respective APIs
    // These will be converted to REST API calls in their respective files
    const { fetchBrand } = await import('./brandAPI');
    const { fetchPersonaRecord } = await import('./personaAPI');
    const { fetchContentSources } = await import('./contentAPI');

    const [brand, persona, contentSources] = await Promise.all([
      fetchBrand(id).catch(() => null),
      fetchPersonaRecord(id).catch(() => null),
      fetchContentSources(id).catch(() => []),
    ]);

    return {
      project,
      brand,
      persona,
      contentSourceCount: contentSources.length,
    };
  } catch (error) {
    console.error('Error fetching project with details:', error);
    throw error;
  }
}

/**
 * Get or create default project for user
 * Useful for onboarding flow
 */
export async function getOrCreateDefaultProject(): Promise<Project> {
  try {
    const projects = await fetchProjects();

    if (projects.length > 0) {
      // Return first project (most recent)
      return projects[0];
    }

    // Create default project
    // Note: User email would need to be passed or fetched from profile
    const defaultName = 'My First Project';

    return await createProject({
      name: defaultName,
      description: 'Your content repurposing project',
    });
  } catch (error) {
    console.error('Error getting or creating default project:', error);
    throw error;
  }
}

/**
 * Duplicate a project (copy brand, persona, but not content sources)
 */
export async function duplicateProject(
  projectId: string,
  newName: string
): Promise<Project> {
  try {
    // Fetch original project details
    const original = await fetchProjectWithDetails(projectId);

    // Create new project
    const newProject = await createProject({
      name: newName,
      description: original.project.description
        ? `Copy of ${original.project.description}`
        : undefined,
    });

    // Copy brand if exists
    if (original.brand) {
      const { createBrand } = await import('./brandAPI');
      const { id, project_id, created_at, updated_at, ...brandData } = original.brand;
      await createBrand({
        ...brandData,
        project_id: newProject.id,
      } as any);
    }

    // Copy persona if exists
    if (original.persona) {
      const { createPersona } = await import('./personaAPI');
      const { id, project_id, created_at, updated_at, created_by, ...personaData } = original.persona;
      await createPersona(newProject.id, {
        ...personaData.persona_data,
      } as any);
    }

    return newProject;
  } catch (error) {
    console.error('Error duplicating project:', error);
    throw error;
  }
}
