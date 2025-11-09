import { Suspense, lazy, useEffect } from 'react';
import type { Platform } from '@/types';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PERFORMANCE_MARKS, PERFORMANCE_MEASURES, markStart, markEnd, trackRouteLoad } from '../../utils/performance';

const ContentCalendar = lazy(() => import('../ContentCalendar').then(m => ({ default: m.ContentCalendar })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

interface OutletContext {
  selectedPlatform: Platform;
}

export function CalendarRoute() {
  const { selectedPlatform } = useOutletContext<OutletContext>();

  // Track calendar route load performance
  useEffect(() => {
    markStart(PERFORMANCE_MARKS.CALENDAR_LOAD_START);

    return () => {
      markEnd(PERFORMANCE_MARKS.CALENDAR_LOAD_END);
      trackRouteLoad(
        PERFORMANCE_MEASURES.CALENDAR_LOAD,
        PERFORMANCE_MARKS.CALENDAR_LOAD_START,
        PERFORMANCE_MARKS.CALENDAR_LOAD_END
      );
    };
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ContentCalendar selectedPlatform={selectedPlatform || 'all'} />
    </Suspense>
  );
}
