import useSWR from 'swr';
import { projectsAPI } from '../utils/api';
import { useAuth } from '../components/AuthContext';
import { logger } from '../utils/logger';
import { CacheKeys, CACHE_TTL, shouldFetch } from '../utils/swr-config';
import type { Project } from '../types';

export interface UseProjectsOptions {
  /** Disable automatic fetching */
  enabled?: boolean;
  /** Custom revalidation interval (ms) */
  refreshInterval?: number;
}

/**
 * Hook to fetch and manage projects with SWR caching
 *
 * Features:
 * - Automatic request deduplication
 * - 1-hour cache TTL (projects don't change frequently)
 * - Background revalidation on focus/reconnect
 * - Optimistic updates for create/update/delete
 *
 * @param options - Hook options
 * @returns Projects data with loading/error states and mutation functions
 *
 * @example
 * const { data: projects, isLoading, error, createProject, updateProject, deleteProject } = useProjects();
 */
export function useProjects(options: UseProjectsOptions = {}) {
  const { user } = useAuth();
  const { enabled = true, refreshInterval } = options;

  // Generate cache key based on user ID
  const cacheKey = user?.id ? CacheKeys.projects(user.id) : null;

  // SWR hook with conditional fetching
  const {
    data: projects,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<Project[]>(
    // Only fetch if enabled and user exists
    enabled && shouldFetch(user?.id) ? cacheKey : null,
    async () => {
      logger.info('Fetching projects for user', { userId: user?.id });
      const { projects } = await projectsAPI.getAll(user!.id);
      logger.info('Projects fetched successfully', { count: projects?.length });
      return projects || [];
    },
    {
      // Cache for 1 hour
      dedupingInterval: CACHE_TTL.STABLE,
      // Revalidate on window focus
      revalidateOnFocus: true,
      // Revalidate on network reconnect
      revalidateOnReconnect: true,
      // Optional refresh interval
      refreshInterval,
      // Keep previous data while revalidating
      keepPreviousData: true,
    }
  );

  /**
   * Create a new project with optimistic update
   */
  const createProject = async (projectData: Partial<Project>): Promise<Project> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      // Optimistic update: Add project immediately to UI
      const optimisticProject: Project = {
        id: `temp-${Date.now()}`,
        name: projectData.name || 'New Project',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
        ...projectData,
      } as Project;

      // Update cache optimistically
      mutate(
        async (currentProjects) => {
          // Add to current list immediately
          return [...(currentProjects || []), optimisticProject];
        },
        {
          // Don't revalidate immediately
          revalidate: false,
        }
      );

      // Actual API call
      const { project: newProject } = await projectsAPI.create(user.id, projectData);

      // Update cache with real data
      mutate(
        (currentProjects) => {
          // Replace optimistic project with real one
          return (currentProjects || []).map((p) =>
            p.id === optimisticProject.id ? newProject : p
          );
        },
        {
          // Don't revalidate (we already have the latest data)
          revalidate: false,
        }
      );

      logger.info('Project created successfully', { projectId: newProject.id });
      return newProject;
    } catch (error) {
      // Rollback optimistic update on error
      mutate();
      logger.error('Failed to create project', error);
      throw error;
    }
  };

  /**
   * Update an existing project with optimistic update
   */
  const updateProject = async (
    projectId: string,
    updates: Partial<Project>
  ): Promise<Project> => {
    try {
      // Optimistic update
      mutate(
        (currentProjects) => {
          return (currentProjects || []).map((p) =>
            p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
          );
        },
        {
          revalidate: false,
        }
      );

      // Actual API call
      const { project: updatedProject } = await projectsAPI.update(projectId, updates);

      // Update cache with real data
      mutate(
        (currentProjects) => {
          return (currentProjects || []).map((p) =>
            p.id === projectId ? updatedProject : p
          );
        },
        {
          revalidate: false,
        }
      );

      logger.info('Project updated successfully', { projectId });
      return updatedProject;
    } catch (error) {
      // Rollback on error
      mutate();
      logger.error('Failed to update project', error, { projectId });
      throw error;
    }
  };

  /**
   * Delete a project with optimistic update
   */
  const deleteProject = async (projectId: string): Promise<void> => {
    try {
      // Optimistic update: Remove immediately
      mutate(
        (currentProjects) => {
          return (currentProjects || []).filter((p) => p.id !== projectId);
        },
        {
          revalidate: false,
        }
      );

      // Actual API call
      await projectsAPI.delete(projectId);

      logger.info('Project deleted successfully', { projectId });
    } catch (error) {
      // Rollback on error
      mutate();
      logger.error('Failed to delete project', error, { projectId });
      throw error;
    }
  };

  /**
   * Manually refresh projects
   */
  const refresh = () => {
    mutate();
  };

  return {
    data: projects,
    isLoading,
    isValidating,
    error: error as Error | undefined,
    createProject,
    updateProject,
    deleteProject,
    refresh,
  };
}
