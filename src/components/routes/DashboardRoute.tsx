import { Suspense, useEffect } from 'react';
import type { Platform } from '@/types';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Home } from '../Home';
import { Loader2 } from 'lucide-react';
import { PERFORMANCE_MARKS, PERFORMANCE_MEASURES, markStart, markEnd, trackRouteLoad } from '../../utils/performance';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

interface OutletContext {
  selectedPlatform: Platform;
  setSelectedPlatform: (platform: Platform) => void;
}

export function DashboardRoute() {
  const { selectedPlatform } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  // Track dashboard load performance
  useEffect(() => {
    markStart(PERFORMANCE_MARKS.DASHBOARD_LOAD_START);

    return () => {
      markEnd(PERFORMANCE_MARKS.DASHBOARD_LOAD_END);
      trackRouteLoad(
        PERFORMANCE_MEASURES.DASHBOARD_LOAD,
        PERFORMANCE_MARKS.DASHBOARD_LOAD_START,
        PERFORMANCE_MARKS.DASHBOARD_LOAD_END
      );
    };
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Home
        selectedPlatform={selectedPlatform || 'all'}
        onNavigate={(view) => navigate(`/${view}`)}
        onOpenAIChat={() => {}}
      />
    </Suspense>
  );
}
