import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PlatformConnections } from "./PlatformConnections";
import { AutomationSettings } from "./AutomationSettings";
import { Templates } from "./Templates";
import { ProjectDetails } from "./ProjectDetails";
import { OAuthTester } from "./OAuthTester";
import { Link2, Workflow, FileText, Settings, TestTube2 } from "lucide-react";

export type ProjectSettingsTab = "details" | "connections" | "automation" | "templates" | "oauth-test";

interface ProjectSettingsProps {
  initialTab?: ProjectSettingsTab;
}

export function ProjectSettings({ initialTab = "details" }: ProjectSettingsProps) {
  const [activeTab, setActiveTab] = useState<ProjectSettingsTab>(initialTab);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border/50">
        <h2 className="text-emerald-400">Project Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure settings for the current project
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProjectSettingsTab)} className="flex-1 flex flex-col">
        <div className="px-6 pt-4">
          <TabsList className="w-full grid grid-cols-5 bg-muted/50">
            <TabsTrigger value="details" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="gap-2">
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">Connections</span>
            </TabsTrigger>
            <TabsTrigger value="oauth-test" className="gap-2">
              <TestTube2 className="w-4 h-4" />
              <span className="hidden sm:inline">OAuth Test</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Workflow className="w-4 h-4" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <TabsContent value="details" className="mt-0">
            <ProjectDetails />
          </TabsContent>

          <TabsContent value="connections" className="mt-0">
            <PlatformConnections />
          </TabsContent>

          <TabsContent value="oauth-test" className="mt-0">
            <OAuthTester />
          </TabsContent>

          <TabsContent value="automation" className="mt-0">
            <AutomationSettings />
          </TabsContent>

          <TabsContent value="templates" className="mt-0">
            <Templates />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
