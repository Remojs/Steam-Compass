import { Clock, Database, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface CacheInfo {
  gameCount: number;
  lastUpdated: Date;
  hoursAgo: number;
  userId: string;
}

interface CacheStatusProps {
  cacheInfo: CacheInfo | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const CacheStatus = ({ cacheInfo, onRefresh, isRefreshing }: CacheStatusProps) => {
  if (!cacheInfo) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="w-4 h-4" />
              Sin caché local
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Cargar datos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTimeColor = (hours: number) => {
    if (hours < 1) return 'text-green-600';
    if (hours < 6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getTimeText = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <Card className="bg-background/50 border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{cacheInfo.gameCount} juegos</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={getTimeColor(cacheInfo.hoursAgo)}>
                hace {getTimeText(cacheInfo.hoursAgo)}
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
