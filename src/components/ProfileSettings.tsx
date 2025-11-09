import { useState, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Upload, User, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useProject } from "./ProjectContext";
import { uploadAPI } from "../utils/api";
import { toast } from "sonner";
import { logger } from '../utils/logger';

export function ProfileSettings() {
  const { user, profilePicture, refreshProfile } = useAuth();
  const { currentProject, projects, refreshProjects } = useProject();
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const getUserInitials = () => {
    const name = user?.user_metadata?.name || user?.email || "U";
    return name.charAt(0).toUpperCase();
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    setUploadingProfile(true);
    try {
      await uploadAPI.uploadProfilePicture(file);
      await refreshProfile();
      toast.success('Profile picture updated successfully!');
    } catch (error: any) {
      logger.error('Profile picture upload error:', error);
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setUploadingProfile(false);
      if (profileInputRef.current) {
        profileInputRef.current.value = '';
      }
    }
  };

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
    } catch (error: any) {
      logger.error('Project logo upload error:', error);
      toast.error(error.message || 'Failed to upload project logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-purple-500/30 bg-purple-500/10">
        <User className="h-4 w-4 text-purple-400" />
        <AlertDescription className="text-purple-200">
          Customize your profile picture (account-wide) and upload logos for your projects.
        </AlertDescription>
      </Alert>

      {/* Profile Picture Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-base mb-1 text-emerald-400">Profile Picture</h3>
            <p className="text-sm text-muted-foreground">
              This profile picture will be displayed across your entire PubHub account.
            </p>
          </div>

          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="w-24 h-24">
                {profilePicture && <AvatarImage src={profilePicture} alt="Profile" />}
                <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  disabled={uploadingProfile}
                />
                <Button
                  onClick={() => profileInputRef.current?.click()}
                  disabled={uploadingProfile}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {uploadingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Picture
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
                    Recommended: Square image (1:1 ratio)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Logo Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-base mb-1 text-emerald-400">Project Logo</h3>
            <p className="text-sm text-muted-foreground">
              Upload a custom logo for the current project. It will appear in the project selector.
            </p>
          </div>

          {currentProject ? (
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
                    variant="outline"
                    className="hover:bg-emerald-500/10 hover:border-emerald-500/30"
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

              <div className="flex-1 space-y-3">
                <div>
                  <Label className="text-sm">Current Project</Label>
                  <p className="text-sm text-muted-foreground mt-1">{currentProject.name}</p>
                </div>
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
                <Alert className="border-amber-500/30 bg-amber-500/10">
                  <AlertDescription className="text-amber-200 text-xs">
                    If no logo is uploaded, the PubHub logo will be displayed as the default.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Please select a project to upload a logo.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Account Information */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-base mb-1 text-emerald-400">Account Information</h3>
            <p className="text-sm text-muted-foreground">
              Your account details.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm">Name</Label>
              <Input 
                value={user?.user_metadata?.name || ''} 
                disabled
                className="mt-1 bg-muted/50"
              />
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input 
                value={user?.email || ''} 
                disabled
                className="mt-1 bg-muted/50"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
