import { Suspense, lazy, useEffect } from 'react';
import type { Platform } from '@/types';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PERFORMANCE_MARKS, PERFORMANCE_MEASURES, markStart, markEnd, trackRouteLoad } from '../../utils/performance';

const Analytics = lazy(() => import('../Analytics').then(m => ({ default: m.Analytics })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

interface OutletContext {
  selectedPlatform: Platform;
}

export function AnalyticsRoute() {
  const { selectedPlatform } = useOutletContext<OutletContext>();

  // Track analytics route load performance
  useEffect(() => {
    markStart(PERFORMANCE_MARKS.ANALYTICS_LOAD_START);

    return () => {
      markEnd(PERFORMANCE_MARKS.ANALYTICS_LOAD_END);
      trackRouteLoad(
        PERFORMANCE_MEASURES.ANALYTICS_LOAD,
        PERFORMANCE_MARKS.ANALYTICS_LOAD_START,
        PERFORMANCE_MARKS.ANALYTICS_LOAD_END
      );
    };
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Analytics selectedPlatform={selectedPlatform || 'all'} />
    </Suspense>
  );
}
