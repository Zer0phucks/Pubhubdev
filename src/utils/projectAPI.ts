/**
 * Project API utilities
 * Handles project CRUD operations and management
 */

import { supabase } from './supabase/client';
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types';

/**
 * Fetch all projects for the current user
 */
export async function fetchProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data as Project[];
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
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as Project;
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...project,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return data as Project;
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
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as Project;
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
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
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

    // Fetch brand
    const { data: brandData } = await supabase
      .from('brands')
      .select('*')
      .eq('project_id', id)
      .single();

    // Fetch persona
    const { data: personaData } = await supabase
      .from('personas')
      .select('*')
      .eq('project_id', id)
      .single();

    // Count content sources
    const { count } = await supabase
      .from('content_sources')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);

    return {
      project,
      brand: brandData,
      persona: personaData,
      contentSourceCount: count || 0,
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
    const { data: { user } } = await supabase.auth.getUser();

    const defaultName = user?.email
      ? `${user.email.split('@')[0]}'s Project`
      : 'My First Project';

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
      const { id, project_id, created_at, updated_at, ...brandData } = original.brand;
      await supabase.from('brands').insert({
        ...brandData,
        project_id: newProject.id,
      });
    }

    // Copy persona if exists
    if (original.persona) {
      const { id, project_id, created_at, updated_at, created_by, ...personaData } = original.persona;
      await supabase.from('personas').insert({
        ...personaData,
        project_id: newProject.id,
      });
    }

    return newProject;
  } catch (error) {
    console.error('Error duplicating project:', error);
    throw error;
  }
}
