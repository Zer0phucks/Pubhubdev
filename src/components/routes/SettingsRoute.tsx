import { Suspense, lazy } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ProjectSettings = lazy(() => import('../ProjectSettings').then(m => ({ default: m.ProjectSettings })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

interface OutletContext {
  projectSettingsTab: any;
}

export function SettingsRoute() {
  const { projectSettingsTab } = useOutletContext<OutletContext>();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProjectSettings initialTab={projectSettingsTab || 'details'} />
    </Suspense>
  );
}
