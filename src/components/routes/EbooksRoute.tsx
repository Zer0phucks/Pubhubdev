import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const EbookGenerator = lazy(() => import('../EbookGenerator').then(m => ({ default: m.EbookGenerator })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

export function EbooksRoute() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EbookGenerator />
    </Suspense>
  );
}
