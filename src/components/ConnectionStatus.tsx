import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { connectionsAPI } from '../utils/api';
import { useProject } from './ProjectContext';
import { logger } from '../utils/logger';

type Platform = "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface ConnectionStatusProps {
  platform?: Platform;
  showLabel?: boolean;
  compact?: boolean;
}

export function ConnectionStatus({ platform, showLabel = true, compact = false }: ConnectionStatusProps) {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentProject } = useProject();

  useEffect(() => {
    loadConnections();
  }, [currentProject?.id]);

  const loadConnections = async () => {
    if (!currentProject) return;
    
    try {
      setLoading(true);
      const { connections: data } = await connectionsAPI.getAll(currentProject.id);
      setConnections(data || []);
    } catch (error) {
      logger.error('Failed to load connections', error);
    } finally{
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        {showLabel && <span>Checking...</span>}
      </Badge>
    );
  }

  // If specific platform requested
  if (platform) {
    const conn = connections.find(c => c.platform === platform);
    const isConnected = conn?.connected;

    if (compact) {
      return isConnected ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      ) : (
        <XCircle className="w-4 h-4 text-muted-foreground" />
      );
    }

    return (
      <Badge 
        variant={isConnected ? "default" : "outline"}
        className={isConnected ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
      >
        {isConnected ? (
          <>
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {showLabel && <span>Connected</span>}
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            {showLabel && <span>Not Connected</span>}
          </>
        )}
      </Badge>
    );
  }

  // Show overall connection count
  const connectedCount = connections.filter(c => c.connected).length;
  const totalCount = connections.length;

  return (
    <Badge 
      variant="outline"
      className={connectedCount > 0 ? "border-emerald-500/30" : ""}
    >
      {connectedCount > 0 ? (
        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
      ) : (
        <XCircle className="w-3 h-3 mr-1 text-muted-foreground" />
      )}
      {showLabel && (
        <span>
          {connectedCount}/{totalCount} Connected
        </span>
      )}
    </Badge>
  );
}
