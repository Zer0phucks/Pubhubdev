import { Suspense, lazy } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const CompetitionWatch = lazy(() => import('../CompetitionWatch').then(m => ({ default: m.CompetitionWatch })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

interface OutletContext {
  selectedPlatform: any;
}

export function CompetitionRoute() {
  const { selectedPlatform } = useOutletContext<OutletContext>();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompetitionWatch selectedPlatform={selectedPlatform || 'all'} />
    </Suspense>
  );
}
