import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSortFilter, Game } from '../../hooks/useSortFilter';
import { useGameCache } from '../../hooks/useGameCache';
import { fetchGames } from '../../services/api';
import { fetchGameMetrics } from '../../services/gameMetricsService';
import { SteamService } from '../../services/steamService';
import { GameTable } from './GameTable';
import { Filters } from './Filters';
import { SteamConnection } from '../SteamConnection';
import { ServerStatus } from '../ServerStatus';
import { CacheStatus } from '../CacheStatus';
import { Button } from '../ui/button';
import { LogOut, RefreshCw, Download, Compass, Clock } from 'lucide-react';

export const Dashboard = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasGames, setHasGames] = useState(false);
  const [showSteamSync, setShowSteamSync] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando biblioteca de juegos...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, logout } = useAuth();
  
  const {
    cachedGames,
    isLoadingFromCache,
    saveToCache,
    clearCache,
    isValidCache,
    getCacheInfo
  } = useGameCache();
  
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
                totalPositiveComments: metrics.total_positive || 0,
                hoursToComplete: metrics.horas, // Tiempo basado en playtime de Steam
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
                totalPositiveComments: 0, // Fallback no tiene datos de comentarios
                hoursToComplete: playedHours,
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
        setHasGames(gamesWithCorrectData.length > 0);
        
        // Guardar en caché los datos procesados
        if (gamesWithCorrectData.length > 0 && user) {
          saveToCache(gamesWithCorrectData, user.id);
        }
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
            totalPositiveComments: 0, // Fallback no tiene datos de comentarios
            hoursToComplete: playedHours,
            hasPlatinum: false,
          };
        });
        setGames(formattedGames);
        setHasGames(formattedGames.length > 0);
        
        // Guardar en caché si tenemos datos
        if (formattedGames.length > 0 && user) {
          saveToCache(formattedGames, user.id);
        }
      } catch (fallbackError) {
        console.error('Error loading fallback games:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, saveToCache]);

  // Efecto para cargar datos iniciales (caché o fresh)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user || isLoadingFromCache) return;
      
      // Si tenemos datos en caché válidos, usarlos
      if (cachedGames && cachedGames.length > 0 && isValidCache(user.id)) {
        console.log('📦 Usando datos del caché');
        setLoadingMessage('Cargando desde caché local...');
        setGames(cachedGames);
        setHasGames(true);
        setIsLoading(false);
        return;
      }
      
      // Si no hay caché válido, cargar desde API
      console.log('🔄 Cargando datos frescos desde API');
      setLoadingMessage('Obteniendo datos actualizados...');
      await loadGamesFromDB();
    };

    loadInitialData();
  }, [user, cachedGames, isLoadingFromCache, isValidCache, loadGamesFromDB]);

  const handleSyncComplete = () => {
    setShowSteamSync(false);
    loadGamesFromDB();
  };

  const handleRefreshLibrary = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    console.log('🔄 Actualizando biblioteca manualmente...');
    
    // Limpiar caché y recargar datos frescos
    clearCache();
    await loadGamesFromDB();
    
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-bg-overlay">
      {/* Header */}
      <header className="bg-gradient-card/80 border-b border-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/src/assets/compass-logo.png"
                alt="Steam Compass Logo"
                className="w-12 h-12"
              />
              <h1 className="text-4xl font-bold text-white">Steam Compass</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Servidor operativo</span>
              </div>
              <div className="text-sm text-white">{user?.username}</div>
              <Button
                variant="outline"
                onClick={logout}
                className="p-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
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
            {/* Juegos Recomendados o Pendientes */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Juegos Recomendados o Pendientes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {games
                  .filter((game) => game.estimatedHours === 0 && game.metascore >= 90)
                  .sort((a, b) => b.positivePercentage - a.positivePercentage)
                  .slice(0, 6)
                  .map((game) => (
                    <div key={game.id} className="p-3 bg-gradient-card rounded-lg shadow-md">
                      <img
                        src={game.cover}
                        alt={game.name}
                        className="w-12 h-12 object-cover rounded-md mb-2"
                      />
                      <h3 className="text-sm font-bold text-foreground mb-1 line-clamp-2">{game.name}</h3>
                      <p className="text-xs text-muted-foreground">Metascore: {game.metascore}</p>
                      <p className="text-xs text-muted-foreground">
                        Tasa de aceptación: {game.positivePercentage}%
                      </p>
                    </div>
                  ))}
              </div>
            </section>

            {/* Biblioteca de Juegos */}
            <section>
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
                </div>
              </div>

              {/* Estado del caché */}
              <CacheStatus 
                cacheInfo={getCacheInfo()}
                onRefresh={handleRefreshLibrary}
                isRefreshing={isRefreshing}
              />

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
            </section>
          </>
        )}
      </main>
    </div>
  );
};