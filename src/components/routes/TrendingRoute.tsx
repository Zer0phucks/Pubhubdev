import { Suspense, lazy } from 'react';
import type { Platform } from '@/types';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Trending = lazy(() => import('../Trending').then(m => ({ default: m.Trending })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

interface OutletContext {
  selectedPlatform: Platform;
}

export function TrendingRoute() {
  const { selectedPlatform } = useOutletContext<OutletContext>();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Trending selectedPlatform={selectedPlatform || 'all'} />
    </Suspense>
  );
}
