import { Suspense, lazy } from 'react';
import { useProject } from '../ProjectContext';
import { Loader2 } from 'lucide-react';

const PersonaSettings = lazy(() => import('../PersonaSettings').then(m => ({ default: m.default })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

export function PersonaRoute() {
  const { currentProject } = useProject();

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <PersonaSettings projectId={currentProject.id} />
    </Suspense>
  );
}
