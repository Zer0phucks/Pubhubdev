import { Suspense } from 'react';
import type { Platform, InboxView } from '@/types';
import { useOutletContext } from 'react-router-dom';
import { UnifiedInbox } from '../UnifiedInbox';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

interface OutletContext {
  selectedPlatform: Platform;
  inboxView: InboxView;
}

export function InboxRoute() {
  const { selectedPlatform, inboxView } = useOutletContext<OutletContext>();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnifiedInbox
        inboxView={inboxView || 'unread'}
        selectedPlatform={selectedPlatform || 'all'}
      />
    </Suspense>
  );
}
