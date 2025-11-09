import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const Notifications = lazy(() => import('../Notifications').then(m => ({ default: m.Notifications })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

export function NotificationsRoute() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Notifications onOpenSettings={() => {}} />
    </Suspense>
  );
}
