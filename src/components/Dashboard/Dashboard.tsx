import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSortFilter, Game } from '../../hooks/useSortFilter';
import { fetchGames } from '../../services/api';
import { fetchGameMetrics } from '../../services/gameMetricsService';
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
  const [loadingMessage, setLoadingMessage] = useState('Cargando biblioteca de juegos...');
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
        // Cargar juegos reales de la biblioteca del usuario desde la base de datos
        const userGames = await SteamService.getUserGamesFromDB(user.id);
        console.log(`📚 Procesando ${userGames.length} juegos de tu biblioteca con datos precisos...`);
        setLoadingMessage(`Procesando ${userGames.length} juegos de tu biblioteca...`);
        
        // Procesar los juegos reales con fetchGameMetrics para obtener datos correctos
        const gamesWithCorrectData: Game[] = [];
        
        // Procesar de a 3 juegos para no sobrecargar las APIs
        for (let i = 0; i < userGames.length; i += 3) {
          const batch = userGames.slice(i, i + 3);
          console.log(`🔄 Procesando lote ${Math.floor(i/3) + 1}/${Math.ceil(userGames.length/3)}`);
          setLoadingMessage(`Lote ${Math.floor(i/3) + 1}/${Math.ceil(userGames.length/3)} - Importando datos...`);
          
          const batchPromises = batch.map(async (game) => {
            try {
              // Actualizar mensaje con el juego actual
              setLoadingMessage(`Importando datos de ${game.name}...`);
              
              // Usar fetchGameMetrics para obtener datos precisos
              const metrics = await fetchGameMetrics({
                appid: game.appid,
                name: game.name,
                playtime_minutes: game.playtime_forever
              });
              
              const playedHours = Math.round(game.playtime_forever / 60);
              
              return {
                id: game.appid.toString(),
                name: game.name,
                cover: game.cover_url || `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/header.jpg`,
                estimatedHours: playedHours,
                metascore: metrics.metascore || 0, // Metascore real de Metacritic
                stars: metrics.stars,
                positivePercentage: metrics.total_positive + metrics.total_negative > 0 
                  ? Math.round((metrics.total_positive / (metrics.total_positive + metrics.total_negative)) * 100)
                  : 0,
                hoursToComplete: metrics.horas, // Tiempo real de HowLongToBeat
                qualityPerHour: metrics.metascore && metrics.horas > 0 
                  ? Math.round((metrics.metascore / metrics.horas) * 100) / 100
                  : 0,
                hasPlatinum: false,
              };
            } catch (error) {
              console.error(`❌ Error obteniendo datos precisos para ${game.name}:`, error);
              // Fallback a datos básicos del juego si falla
              const playedHours = Math.round(game.playtime_forever / 60);
              return {
                id: game.appid.toString(),
                name: game.name,
                cover: game.cover_url || `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/header.jpg`,
                estimatedHours: playedHours,
                metascore: game.metacritic_score || 0,
                stars: game.stars_rating || 3,
                positivePercentage: game.review_percentage || 0,
                hoursToComplete: playedHours,
                qualityPerHour: 0,
                hasPlatinum: false,
              };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          gamesWithCorrectData.push(...batchResults);
          
          // Pausa entre lotes
          if (i + 3 < userGames.length) {
            console.log(`⏳ Esperando 2s antes del siguiente lote...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        console.log(`✅ ${gamesWithCorrectData.length} juegos de tu biblioteca procesados con datos precisos`);
        setLoadingMessage('Finalizando importación...');
        setGames(gamesWithCorrectData);
      } else {
        // Si no tiene juegos, mostrar opción de sincronización
        setShowSteamSync(true);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      // Fallback a datos básicos de la DB si hay error
      try {
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
            hoursToComplete: playedHours,
            qualityPerHour: 0,
            hasPlatinum: false,
          };
        });
        setGames(formattedGames);
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
              loadingMessage={loadingMessage}
            />
          </>
        )}
      </main>
    </div>
  );
};