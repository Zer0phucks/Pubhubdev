import { useState } from "react";
import { Check, ChevronsUpDown, Plus, FolderOpen } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useProject } from "./ProjectContext";
import { CreateProjectDialog } from "./CreateProjectDialog";

export function ProjectSwitcher() {
  const { currentProject, projects, setCurrentProject } = useProject();
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleProjectSelect = async (project: any) => {
    await setCurrentProject(project);
    setOpen(false);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 px-3 bg-sidebar-accent/50 hover:bg-sidebar-accent border-sidebar-border"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {currentProject?.name || "Select project"}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]" align="start">
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onSelect={() => handleProjectSelect(project)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{project.name}</span>
              </div>
              {currentProject?.id === project.id && (
                <Check className="w-4 h-4 flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            <span>Create Project</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
