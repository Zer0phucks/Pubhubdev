import { DashboardOverview } from "./DashboardOverview";

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface HomeProps {
  selectedPlatform: Platform;
  onNavigate?: (view: "compose" | "calendar") => void;
  onOpenAIChat?: (query?: string, autoSubmit?: boolean) => void;
}

export function Home({ selectedPlatform, onNavigate, onOpenAIChat }: HomeProps) {
  return (
    <DashboardOverview 
      selectedPlatform={selectedPlatform} 
      onNavigate={onNavigate}
      onOpenAIChat={onOpenAIChat}
    />
  );
}