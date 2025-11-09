import { Suspense, lazy } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ContentCalendar = lazy(() => import('../ContentCalendar').then(m => ({ default: m.ContentCalendar })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

interface OutletContext {
  selectedPlatform: any;
}

export function CalendarRoute() {
  const { selectedPlatform } = useOutletContext<OutletContext>();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ContentCalendar selectedPlatform={selectedPlatform || 'all'} />
    </Suspense>
  );
}
