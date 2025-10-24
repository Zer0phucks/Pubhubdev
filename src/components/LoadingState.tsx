import { Loader2 } from "lucide-react";
import { Card } from "./ui/card";

interface LoadingStateProps {
  message?: string;
  variant?: "default" | "subtle";
}

export function LoadingState({ message = "Loading...", variant = "default" }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );

  if (variant === "subtle") {
    return content;
  }

  return <Card className="w-full">{content}</Card>;
}
