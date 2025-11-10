import { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { Upload, Image as ImageIcon, Loader2, Check, Save, FolderOpen } from "lucide-react";
import { useProject } from "./ProjectContext";
import { uploadAPI } from "../utils/api";
import { toast } from "sonner";
import { logger } from '../utils/logger';
import { toAppError } from '../types';

export function ProjectDetails() {
  const { currentProject, projects, refreshProjects, updateProject } = useProject();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [projectName, setProjectName] = useState(currentProject?.name || "");
  const [projectDescription, setProjectDescription] = useState(currentProject?.description || "");
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Update local state when currentProject changes
  useEffect(() => {
    if (currentProject) {
      setProjectName(currentProject.name);
      setProjectDescription(currentProject.description);
    }
  }, [currentProject]);

  const handleProjectLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, GIF, WebP, or SVG image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      toast.error('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setUploadingLogo(true);
    try {
      await uploadAPI.uploadProjectLogo(currentProject.id, file);
      await refreshProjects();
      toast.success('Project logo updated successfully!');
    } catch (error: unknown) {
      const err = toAppError(error);
      logger.error('Project logo upload error:', error);
      toast.error(err.message || 'Failed to upload project logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleSaveDetails = async () => {
    if (!currentProject) return;

    if (!projectName.trim()) {
      toast.error('Project name cannot be empty');
      return;
    }

    setSavingDetails(true);
    try {
      await updateProject(currentProject.id, {
        name: projectName,
        description: projectDescription,
      });
      await refreshProjects();
      toast.success('Project details updated successfully!');
    } catch (error: unknown) {
      const err = toAppError(error);
      logger.error('Project update error:', error);
      toast.error(err.message || 'Failed to update project details');
    } finally {
      setSavingDetails(false);
    }
  };

  if (!currentProject) {
    return (
      <Alert>
        <FolderOpen className="h-4 w-4" />
        <AlertDescription>
          Please select a project to view and edit its details.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-purple-500/30 bg-purple-500/10">
        <FolderOpen className="h-4 w-4 text-purple-400" />
        <AlertDescription className="text-purple-200">
          Customize your project details, name, description, and logo.
        </AlertDescription>
      </Alert>

      {/* Project Logo Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-base mb-1 text-emerald-400">Project Logo</h3>
            <p className="text-sm text-muted-foreground">
              Upload a custom logo for this project. It will appear in the project selector.
            </p>
          </div>

          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-lg border-2 border-border bg-card flex items-center justify-center overflow-hidden">
                {currentProject.logo ? (
                  <img 
                    src={currentProject.logo} 
                    alt={currentProject.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-xs">No logo</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handleProjectLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
                <Button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="text-sm">
                <p className="text-muted-foreground mb-2">Requirements:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Supported formats: JPEG, PNG, GIF, WebP, SVG
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Maximum file size: 5MB
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Recommended: Square or icon-sized image
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Information */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-base mb-1 text-emerald-400">Project Information</h3>
            <p className="text-sm text-muted-foreground">
              Update the name and description of your project.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm">Project Name</Label>
              <Input 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Textarea 
                value={projectDescription} 
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description (optional)"
                className="mt-1 resize-none"
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleSaveDetails}
                disabled={savingDetails || !projectName.trim()}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {savingDetails ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setProjectName(currentProject.name);
                  setProjectDescription(currentProject.description);
                }}
                disabled={savingDetails}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Metadata */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-base mb-1 text-emerald-400">Project Metadata</h3>
            <p className="text-sm text-muted-foreground">
              Read-only information about this project.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Project ID</Label>
              <p className="text-sm font-mono bg-muted/50 p-2 rounded mt-1">{currentProject.id}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Created</Label>
              <p className="text-sm bg-muted/50 p-2 rounded mt-1">
                {new Date(currentProject.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {currentProject.updatedAt && (
              <div>
                <Label className="text-sm text-muted-foreground">Last Updated</Label>
                <p className="text-sm bg-muted/50 p-2 rounded mt-1">
                  {new Date(currentProject.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
