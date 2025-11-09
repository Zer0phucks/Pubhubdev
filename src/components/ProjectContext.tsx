import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { logger } from "../utils/logger";

interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  isDefault?: boolean;
  logo?: string;
  logoPath?: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  setCurrentProject: (project: Project) => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, getToken } = useAuth();

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e`;

  // Fetch all projects
  const fetchProjects = async () => {
    if (!isAuthenticated) return;

    try {
      const token = await getToken();
      if (!token) return;
      
      const response = await fetch(`${baseUrl}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        
        // If we have projects but no current project, set the first one
        if (data.projects && data.projects.length > 0 && !currentProject) {
          await fetchCurrentProject();
        }
      }
    } catch (error) {
      logger.error("Error fetching projects", error);
    }
  };

  // Fetch current project
  const fetchCurrentProject = async () => {
    if (!isAuthenticated) return;

    try {
      const token = await getToken();
      if (!token) return;
      
      const response = await fetch(`${baseUrl}/projects/current`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.project) {
          setCurrentProjectState(data.project);
          localStorage.setItem("currentProjectId", data.project.id);
        }
      }
    } catch (error) {
      logger.error("Error fetching current project", error);
    } finally {
      setLoading(false);
    }
  };

  // Set current project
  const setCurrentProject = async (project: Project) => {
    if (!isAuthenticated) return;

    try {
      const token = await getToken();
      if (!token) return;
      
      const response = await fetch(`${baseUrl}/projects/current`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (response.ok) {
        setCurrentProjectState(project);
        localStorage.setItem("currentProjectId", project.id);
      }
    } catch (error) {
      logger.error("Error setting current project", error);
    }
  };

  // Create new project
  const createProject = async (name: string, description?: string): Promise<Project> => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }

    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      
      const response = await fetch(`${baseUrl}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchProjects();
        return data.project;
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create project");
      }
    } catch (error) {
      logger.error("Error creating project", error);
      throw error;
    }
  };

  // Update project
  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!isAuthenticated) return;

    try {
      const token = await getToken();
      if (!token) return;
      
      const response = await fetch(`${baseUrl}/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchProjects();
        
        // Update current project if it's the one being updated
        if (currentProject?.id === id) {
          const data = await response.json();
          setCurrentProjectState(data.project);
        }
      }
    } catch (error) {
      logger.error("Error updating project", error);
      throw error;
    }
  };

  // Delete project
  const deleteProject = async (id: string) => {
    if (!isAuthenticated) return;

    try {
      const token = await getToken();
      if (!token) return;
      
      const response = await fetch(`${baseUrl}/projects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchProjects();
        
        // If we deleted the current project, fetch the new current project
        if (currentProject?.id === id) {
          await fetchCurrentProject();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete project");
      }
    } catch (error) {
      logger.error("Error deleting project", error);
      throw error;
    }
  };

  // Refresh projects
  const refreshProjects = async () => {
    await fetchProjects();
  };

  // Initialize on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      fetchCurrentProject();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const value: ProjectContextType = {
    currentProject,
    projects,
    loading,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
