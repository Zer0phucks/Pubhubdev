import { TrendingPosts } from "./TrendingPosts";

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface TrendingProps {
  selectedPlatform: Platform;
}

export function Trending({ selectedPlatform }: TrendingProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Trending Content</h1>
        <p className="text-muted-foreground">
          Discover top-performing posts in your niche across social platforms
        </p>
      </div>

      <TrendingPosts selectedPlatform={selectedPlatform} />
    </div>
  );
}
