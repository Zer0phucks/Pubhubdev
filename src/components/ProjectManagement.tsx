import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { FolderOpen, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useProject } from "./ProjectContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { CreateProjectDialog } from "./CreateProjectDialog";

export function ProjectManagement() {
  const { projects, currentProject, updateProject, deleteProject, setCurrentProject } = useProject();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleEdit = (project: any) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDescription(project.description || "");
  };

  const handleSave = async (projectId: string) => {
    try {
      await updateProject(projectId, {
        name: editName,
        description: editDescription,
      });
      setEditingId(null);
      toast.success("Project updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update project");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete);
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
    }
  };

  const handleSetCurrent = async (project: any) => {
    try {
      await setCurrentProject(project);
      toast.success(`Switched to ${project.name}`);
    } catch (error: any) {
      toast.error("Failed to switch project");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg">Projects</h3>
          <p className="text-muted-foreground">
            Manage your workspaces and campaigns
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="space-y-3">
        {projects.map((project) => {
          const isEditing = editingId === project.id;
          const isCurrent = currentProject?.id === project.id;

          return (
            <Card key={project.id} className="p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`name-${project.id}`}>Project Name</Label>
                    <Input
                      id={`name-${project.id}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`desc-${project.id}`}>Description</Label>
                    <Textarea
                      id={`desc-${project.id}`}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(project.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 flex-shrink-0">
                      <FolderOpen className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate">{project.name}</h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex-shrink-0">
                            Current
                          </span>
                        )}
                        {project.isDefault && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs flex-shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-muted-foreground mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-1 text-xs">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetCurrent(project)}
                      >
                        Switch
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(project)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {!project.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(project.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {projects.length === 0 && (
          <Card className="p-8 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="mb-2">No projects yet</h4>
            <p className="text-muted-foreground mb-4">
              Create your first project to get started
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </Card>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This will permanently
              delete all posts, connections, and data associated with this project.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
