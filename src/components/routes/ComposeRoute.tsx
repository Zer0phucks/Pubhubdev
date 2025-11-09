import { Suspense } from 'react';
import { ContentComposer } from '../ContentComposer';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

export function ComposeRoute() {
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
