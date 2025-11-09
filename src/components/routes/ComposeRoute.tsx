import { Suspense, useEffect } from 'react';
import { ContentComposer } from '../ContentComposer';
import { Loader2 } from 'lucide-react';
import { PERFORMANCE_MARKS, PERFORMANCE_MEASURES, markStart, markEnd, trackRouteLoad } from '../../utils/performance';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

export function ComposeRoute() {
  // Track compose route load performance
  useEffect(() => {
    markStart(PERFORMANCE_MARKS.COMPOSE_LOAD_START);

    return () => {
      markEnd(PERFORMANCE_MARKS.COMPOSE_LOAD_END);
      trackRouteLoad(
        PERFORMANCE_MEASURES.COMPOSE_LOAD,
        PERFORMANCE_MARKS.COMPOSE_LOAD_START,
        PERFORMANCE_MARKS.COMPOSE_LOAD_END
      );
    };
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ContentComposer
        transformedContent={null}
        remixContent={null}
        onContentUsed={() => {}}
      />
    </Suspense>
  );
}
