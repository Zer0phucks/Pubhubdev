import { DashboardOverview } from "./DashboardOverview";

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface HomeProps {
  selectedPlatform: Platform;
}

export function Home({ selectedPlatform }: HomeProps) {
  return <DashboardOverview selectedPlatform={selectedPlatform} />;
}