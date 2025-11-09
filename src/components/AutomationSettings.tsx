import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Alert, AlertDescription } from "./ui/alert";
import { PlatformIcon } from "./PlatformIcon";
import { CreateAutomationDialog } from "./CreateAutomationDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { 
  Zap, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowRight,
  Sparkles,
  Clock,
  Info,
  AlertTriangle
} from "lucide-react";
import {
  AutomationRule,
  getAutomationRules,
  addAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,
  getTransformationLabel,
  getActionLabel,
} from "../utils/automationRules";
import { toast } from "sonner";

export function AutomationSettings() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AutomationRule | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = () => {
    setRules(getAutomationRules());
  };

  const handleCreateRule = (ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'>) => {
    addAutomationRule(ruleData);
    loadRules();
    toast.success("Automation Rule Created", {
      description: "Your automation rule is now active and will process new videos.",
    });
  };

  const handleUpdateRule = (ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'>) => {
    if (editingRule) {
      updateAutomationRule(editingRule.id, ruleData);
      loadRules();
      setEditingRule(null);
      toast.success("Automation Rule Updated");
    }
  };

  const handleToggleRule = (id: string) => {
    toggleAutomationRule(id);
    loadRules();
    const rule = rules.find(r => r.id === id);
    toast.success(rule?.enabled ? "Rule Disabled" : "Rule Enabled");
  };

  const handleDeleteClick = (rule: AutomationRule) => {
    setRuleToDelete(rule);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteAutomationRule(ruleToDelete.id);
      loadRules();
      toast.success("Automation Rule Deleted");
    }
    setRuleToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-emerald-400 mb-2">Automation Workflows</h2>
        <p className="text-muted-foreground">
          Automatically transform your video content into other formats when published
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Info className="w-4 h-4 text-blue-400" />
        <AlertDescription className="text-blue-400">
          <span className="font-medium">How it works:</span> When you publish a new video on YouTube or TikTok, 
          matching automation rules will automatically transform it into the specified content format.
        </AlertDescription>
      </Alert>

      {/* Create New Rule Button */}
      <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Create Automation Rule
      </Button>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3>No Automation Rules Yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Create your first automation rule to automatically transform your videos into other content formats
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={rule.enabled ? '' : 'opacity-60'}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => handleToggleRule(rule.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate">{rule.name}</h3>
                        {!rule.enabled && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRule(rule);
                        setCreateDialogOpen(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(rule)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Workflow Visualization */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Trigger */}
                  <Card className="bg-accent/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">When</p>
                          <div className="flex items-center gap-1 mt-1">
                            <PlatformIcon platform={rule.trigger.platform} className="w-4 h-4" />
                            <span className="text-sm">
                              {rule.trigger.platform === 'youtube' ? 'YouTube' : 'TikTok'} video
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

                  {/* Transformation */}
                  <Card className="bg-accent/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Transform to</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm">{getTransformationLabel(rule.transformation)}</p>
                            {rule.transformationInstructions && (
                              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                                Custom
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

                  {/* Action */}
                  <Card className="bg-accent/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Then</p>
                          <p className="text-sm mt-1">{getActionLabel(rule.action)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters */}
                {(rule.trigger.minDuration || rule.trigger.keywords) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Filters:</span>
                    {rule.trigger.minDuration && (
                      <Badge variant="outline" className="text-xs">
                        Min {Math.floor(rule.trigger.minDuration / 60)} min
                      </Badge>
                    )}
                    {rule.trigger.keywords && rule.trigger.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        "{keyword}"
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Custom Instructions */}
                {rule.transformationInstructions && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-purple-400 font-medium">Custom Instructions:</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      "{rule.transformationInstructions}"
                    </p>
                  </div>
                )}

                {/* Target Platforms */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Publishes to:</span>
                  <div className="flex items-center gap-1">
                    {rule.targetPlatforms.map((platform) => (
                      <PlatformIcon key={platform} platform={platform} className="w-4 h-4" />
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                  <div>
                    <span>Executed: </span>
                    <span className="text-foreground">{rule.executionCount} times</span>
                  </div>
                  {rule.lastTriggered && (
                    <div>
                      <span>Last run: </span>
                      <span className="text-foreground">{formatDate(rule.lastTriggered)}</span>
                    </div>
                  )}
                  <div className="ml-auto">
                    <span>Created: </span>
                    <span className="text-foreground">{formatDate(rule.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Warning for Auto-Publish */}
      {rules.some(r => r.action === 'auto-publish' && r.enabled) && (
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <AlertDescription className="text-yellow-400">
            <span className="font-medium">Warning:</span> You have auto-publish rules enabled. 
            Content will be automatically published without review. Make sure your transformations are accurate.
          </AlertDescription>
        </Alert>
      )}

      {/* Create/Edit Dialog */}
      <CreateAutomationDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setEditingRule(null);
        }}
        onSave={editingRule ? handleUpdateRule : handleCreateRule}
        editRule={editingRule}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete automation rule?"
        description={
          ruleToDelete
            ? `Are you sure you want to delete "${ruleToDelete.name}"? This action cannot be undone.`
            : "Are you sure you want to delete this automation rule? This action cannot be undone."
        }
        confirmText="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
