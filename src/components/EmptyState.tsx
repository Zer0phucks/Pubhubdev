import { LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "subtle";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
}: EmptyStateProps) {
  const content = (
    <div className="text-center py-12 px-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );

  if (variant === "subtle") {
    return content;
  }

  return <Card className="w-full">{content}</Card>;
}
