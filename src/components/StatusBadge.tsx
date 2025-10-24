import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

type Status = "success" | "warning" | "error" | "info" | "default";

interface StatusBadgeProps {
  status: Status;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const variants = {
    success: "bg-success/10 text-success border-success/20 hover:bg-success/20",
    warning: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
    error: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    info: "bg-info/10 text-info border-info/20 hover:bg-info/20",
    default: "",
  };

  return (
    <Badge variant="outline" className={cn(variants[status], className)}>
      {children}
    </Badge>
  );
}
