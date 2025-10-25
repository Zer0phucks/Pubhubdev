import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ProfileSettings } from "./ProfileSettings";
import { User, Keyboard, Bell, Palette } from "lucide-react";

export type AccountSettingsTab = "profile" | "shortcuts" | "notifications" | "preferences";

interface AccountSettingsProps {
  initialTab?: AccountSettingsTab;
  onClose?: () => void;
}

export function AccountSettings({ initialTab = "profile", onClose }: AccountSettingsProps) {
  const [activeTab, setActiveTab] = useState<AccountSettingsTab>(initialTab);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border/50">
        <h2 className="text-emerald-400">Account Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal PubHub account preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AccountSettingsTab)} className="flex-1 flex flex-col">
        <div className="px-6 pt-4">
          <TabsList className="w-full grid grid-cols-4 bg-muted/50">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="gap-2">
              <Keyboard className="w-4 h-4" />
              <span className="hidden sm:inline">Shortcuts</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <TabsContent value="profile" className="mt-0">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="shortcuts" className="mt-0">
            <ShortcutsSettings />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <NotificationsSettings />
          </TabsContent>

          <TabsContent value="preferences" className="mt-0">
            <PreferencesSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ShortcutsSettings() {
  interface KeyboardShortcut {
    category: string;
    shortcuts: { keys: string; description: string }[];
  }

  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      category: "Navigation",
      shortcuts: [
        { keys: "⌘H", description: "Go to Home" },
        { keys: "⌘N", description: "New Post" },
        { keys: "⌘I", description: "Open Inbox" },
        { keys: "⌘C", description: "Open Calendar" },
        { keys: "⌘A", description: "Open Analytics" },
      ],
    },
    {
      category: "Actions",
      shortcuts: [
        { keys: "⌘K", description: "Open AI Chat" },
        { keys: "⌘⇧K", description: "Open Command Palette" },
        { keys: "⌘,", description: "Open Settings Panel" },
        { keys: "⌘S", description: "Save Draft" },
        { keys: "⌘Enter", description: "Publish Post" },
      ],
    },
    {
      category: "Editing",
      shortcuts: [
        { keys: "⌘B", description: "Bold Text" },
        { keys: "⌘I", description: "Italic Text" },
        { keys: "⌘U", description: "Underline Text" },
        { keys: "⌘Z", description: "Undo" },
        { keys: "⌘⇧Z", description: "Redo" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {keyboardShortcuts.map((category) => (
        <div key={category.category}>
          <h3 className="text-sm text-emerald-400 mb-3">{category.category}</h3>
          <div className="space-y-2">
            {category.shortcuts.map((shortcut) => (
              <div
                key={shortcut.keys}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
              >
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs bg-muted border border-border rounded">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [postReminders, setPostReminders] = useState(true);
  const [inboxAlerts, setInboxAlerts] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm text-emerald-400 mb-3">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Get browser notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm">Post Reminders</p>
              <p className="text-xs text-muted-foreground">Remind me about scheduled posts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={postReminders}
                onChange={(e) => setPostReminders(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm">Inbox Alerts</p>
              <p className="text-xs text-muted-foreground">Alert me of new messages and comments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={inboxAlerts}
                onChange={(e) => setInboxAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferencesSettings() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [compactMode, setCompactMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm text-emerald-400 mb-3">Appearance</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm mb-2">Theme</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme("dark")}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  theme === "dark"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className="w-full h-16 rounded bg-gradient-to-br from-gray-900 to-gray-800 mb-2" />
                <p className="text-sm">Dark</p>
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  theme === "light"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className="w-full h-16 rounded bg-gradient-to-br from-gray-100 to-gray-200 mb-2" />
                <p className="text-sm">Light</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm text-emerald-400 mb-3">Editor Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm">Compact Mode</p>
              <p className="text-xs text-muted-foreground">Reduce spacing in the interface</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm">Auto-save Drafts</p>
              <p className="text-xs text-muted-foreground">Automatically save your work</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
