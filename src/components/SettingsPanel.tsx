import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import { Separator } from "./ui/separator";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

export function SettingsPanel({ open, onOpenChange, theme, onThemeChange }: SettingsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader className="pt-6">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Customize your PubHub experience
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Appearance */}
          <div className="space-y-3">
            <Label>Appearance</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => onThemeChange("light")}
                className={`h-auto flex-col gap-2 p-4 ${
                  theme === "light"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : ""
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-sm">Light</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onThemeChange("dark")}
                className={`h-auto flex-col gap-2 p-4 ${
                  theme === "dark"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : ""
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-sm">Dark</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Account Info */}
          <div className="space-y-3">
            <Label>Account</Label>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span>John Doe</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username</span>
                <span>@johndoe</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>john@example.com</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Preferences */}
          <div className="space-y-3">
            <Label>Preferences</Label>
            <div className="text-sm text-muted-foreground">
              More settings coming soon...
            </div>
          </div>

          <Separator />

          {/* About */}
          <div className="space-y-3">
            <Label>About</Label>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build</span>
                <span>2025.01.06</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
