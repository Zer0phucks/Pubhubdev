import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { PlatformIcon } from "./PlatformIcon";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  FileText,
} from "lucide-react";
import { getCustomTemplates, deleteCustomTemplate, type CustomTemplate } from "../utils/customTemplates";
import { toast } from "sonner@2.0.3";

export function Templates() {
  const [templates, setTemplates] = useState<CustomTemplate[]>(getCustomTemplates());
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<CustomTemplate | null>(null);

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.platforms.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEdit = (template: CustomTemplate) => {
    setEditingTemplate(template);
    setCreateDialogOpen(true);
  };

  const handleDeleteClick = (template: CustomTemplate) => {
    setTemplateToDelete(template);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteCustomTemplate(templateToDelete.id);
      setTemplates(getCustomTemplates());
      toast.success("Template Deleted");
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleDuplicate = (template: CustomTemplate) => {
    const duplicated = {
      ...template,
      name: `${template.name} (Copy)`,
    };
    setEditingTemplate(duplicated);
    setCreateDialogOpen(true);
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    setEditingTemplate(null);
    setTemplates(getCustomTemplates());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group hover:border-primary/50 transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3>{template.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                    {template.content.slice(0, 100)}...
                  </p>
                </div>
                <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
              </div>

              {/* Platforms */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Platforms:</span>
                {template.platforms.map((platform) => (
                  <Badge key={platform} variant="secondary" className="gap-1">
                    <PlatformIcon platform={platform as any} className="w-3 h-3" />
                    {platform}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                  className="flex-1 gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(template)}
                  className="gap-1"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(template)}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3>No templates found</h3>
            <p className="text-muted-foreground mt-2">
              {searchQuery
                ? "Try adjusting your search query"
                : "Create your first template to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setCreateDialogOpen(true)} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={handleDialogClose}
        editTemplate={editingTemplate}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Delete Template"
        description={`Are you sure you want to delete "${templateToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
