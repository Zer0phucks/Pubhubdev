import { Suspense, lazy } from 'react';
import type { Platform } from '@/types';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const MediaLibrary = lazy(() => import('../MediaLibrary').then(m => ({ default: m.MediaLibrary })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

interface OutletContext {
  selectedPlatform: Platform;
}

export function LibraryRoute() {
  const { selectedPlatform } = useOutletContext<OutletContext>();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <MediaLibrary
        selectedPlatform={selectedPlatform || 'all'}
        onRemix={() => {}}
      />
    </Suspense>
  );
}
