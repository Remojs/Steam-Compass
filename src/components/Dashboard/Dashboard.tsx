import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSortFilter, Game } from '../../hooks/useSortFilter';
import { fetchGames } from '../../services/api';
import { SteamService } from '../../services/steamService';
import { GameTable } from './GameTable';
import { Filters } from './Filters';
import { SteamConnection } from '../SteamConnection';
import { ServerStatus } from '../ServerStatus';
import { Button } from '../ui/button';
import { LogOut, RefreshCw, Download, Compass } from 'lucide-react';

export const Dashboard = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasGames, setHasGames] = useState(false);
  const [showSteamSync, setShowSteamSync] = useState(false);
  const { user, logout } = useAuth();
  
  const {
    sortedAndFilteredGames,
    sortState,
    filterState,
    setSortField,
    setPositivePercentageFilter
  } = useSortFilter(games);

  const loadGamesFromDB = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Verificar si el usuario tiene juegos en la base de datos
      const userHasGames = await SteamService.hasGames(user.id);
      setHasGames(userHasGames);
      
      if (userHasGames) {
        // Cargar juegos desde la base de datos
        const userGames = await SteamService.getUserGamesFromDB(user.id);
        
        const formattedGames: Game[] = userGames.map(game => {
          const playedHours = Math.round(game.playtime_forever / 60);
          
          return {
            id: game.appid.toString(),
            name: game.name,
            cover: game.cover_url || '',
            estimatedHours: playedHours,
            metascore: game.metacritic_score || 0,
            stars: game.stars_rating || 0,
            positivePercentage: game.review_percentage || 0,
            hoursToComplete: game.main_story_hours || game.estimated_completion_time || undefined,
            qualityPerHour: game.quality_score || undefined,
            hasPlatinum: false,
          };
        });
        setGames(formattedGames);
      } else {
        // Si no tiene juegos, mostrar opción de sincronización
        setShowSteamSync(true);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      // Fallback a datos mock si hay error
      try {
        const gameData = await fetchGames();
        setGames(gameData);
      } catch (fallbackError) {
        console.error('Error loading fallback games:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGamesFromDB();
  }, [loadGamesFromDB]);

  const handleSyncComplete = () => {
    setShowSteamSync(false);
    loadGamesFromDB();
  };

  const handleRefreshLibrary = () => {
    loadGamesFromDB();
  };

  return (
    <div className="min-h-screen bg-gradient-bg-overlay">
      {/* Header */}
      <header className="bg-gradient-card/80 border-b border-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center p-2">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
                  Steam Compass
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenido, {user?.username}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ServerStatus />
              <Button
                variant="outline"
                onClick={logout}
                className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {showSteamSync ? (
          <div className="mb-8">
            <SteamConnection onSyncComplete={handleSyncComplete} />
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-3 text-foreground">Tu Biblioteca de Juegos</h2>
                <p className="text-muted-foreground">
                  {!isLoading && (
                    <>
                      Mostrando {sortedAndFilteredGames.length} de {games.length} juegos
                    </>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSteamSync(true)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Sincronizar Steam
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefreshLibrary}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualizar
                </Button>
              </div>
            </div>

            <Filters
              sortState={sortState}
              filterState={filterState}
              onSortField={setSortField}
              onPositivePercentageFilter={setPositivePercentageFilter}
            />

            <GameTable 
              games={sortedAndFilteredGames} 
              isLoading={isLoading}
            />
          </>
        )}
      </main>
    </div>
  );
};