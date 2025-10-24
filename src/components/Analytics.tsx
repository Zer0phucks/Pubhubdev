import { CombinedInsights } from "./CombinedInsights";

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface AnalyticsProps {
  selectedPlatform: Platform;
}

export function Analytics({ selectedPlatform }: AnalyticsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-emerald-400 mb-2">Analytics</h2>
        <p className="text-muted-foreground">
          Track your performance, engagement, and growth across all platforms
        </p>
      </div>

      <CombinedInsights selectedPlatform={selectedPlatform} />
    </div>
  );
}
