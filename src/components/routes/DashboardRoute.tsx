import { Suspense } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Home } from '../Home';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

interface OutletContext {
  selectedPlatform: any;
  setSelectedPlatform: (platform: any) => void;
}

export function DashboardRoute() {
  const { selectedPlatform } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Home
        selectedPlatform={selectedPlatform || 'all'}
        onNavigate={(view) => navigate(`/${view}`)}
        onOpenAIChat={() => {}}
      />
    </Suspense>
  );
}
