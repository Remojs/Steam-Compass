import { Game } from '../hooks/useSortFilter';
import { fetchGameMetrics } from './gameMetricsService';

// Services
import { SupabaseService } from './supabaseService';

/**
 * Fetch games data con datos reales usando fetchGameMetrics
 */
export const fetchGames = async (): Promise<Game[]> => {
  // Juegos populares con sus AppIDs reales de Steam para obtener datos precisos
  const popularGames = [
    { appid: 2195250, name: 'EA SPORTS FC 25', playtime_minutes: 2400 }, // FC25 real AppID
    { appid: 292030, name: 'The Witcher 3: Wild Hunt', playtime_minutes: 6000 },
    { appid: 620, name: 'Portal 2', playtime_minutes: 480 },
    { appid: 1174180, name: 'Red Dead Redemption 2', playtime_minutes: 3600 },
    { appid: 271590, name: 'Grand Theft Auto V', playtime_minutes: 3000 },
    { appid: 1086940, name: "Baldur's Gate 3", playtime_minutes: 4500 }
  ];

  console.log('🎮 Obteniendo datos reales para juegos populares...');
  
  const gamesWithRealData: Game[] = [];
  
  // Procesar juegos de a 2 para no sobrecargar las APIs
  for (let i = 0; i < popularGames.length; i += 2) {
    const batch = popularGames.slice(i, i + 2);
    
    const batchPromises = batch.map(async (gameInfo) => {
      try {
        const metrics = await fetchGameMetrics({
          appid: gameInfo.appid,
          name: gameInfo.name,
          playtime_minutes: gameInfo.playtime_minutes
        });
        
        return {
          id: gameInfo.appid.toString(),
          name: metrics.name,
          cover: `https://steamcdn-a.akamaihd.net/steam/apps/${gameInfo.appid}/header.jpg`,
          estimatedHours: Math.round(gameInfo.playtime_minutes / 60),
          metascore: metrics.metascore || 0,
          stars: metrics.stars,
          positivePercentage: metrics.total_positive + metrics.total_negative > 0 
            ? Math.round((metrics.total_positive / (metrics.total_positive + metrics.total_negative)) * 100)
            : 0,
          hoursToComplete: metrics.horas,
          qualityPerHour: metrics.metascore && metrics.horas > 0 
            ? Math.round((metrics.metascore / metrics.horas) * 100) / 100
            : 0,
          hasPlatinum: false
        };
      } catch (error) {
        console.error(`❌ Error obteniendo datos para ${gameInfo.name}:`, error);
        // Fallback básico si falla
        return {
          id: gameInfo.appid.toString(),
          name: gameInfo.name,
          cover: `https://steamcdn-a.akamaihd.net/steam/apps/${gameInfo.appid}/header.jpg`,
          estimatedHours: Math.round(gameInfo.playtime_minutes / 60),
          metascore: 0,
          stars: 3,
          positivePercentage: 0,
          hoursToComplete: Math.round(gameInfo.playtime_minutes / 60),
          qualityPerHour: 0,
          hasPlatinum: false
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    gamesWithRealData.push(...batchResults);
    
    // Pausa entre lotes
    if (i + 2 < popularGames.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('✅ Datos reales obtenidos para todos los juegos');
  return gamesWithRealData;
};

/**
 * Fetch user's Steam library con datos reales
 */
export const fetchSteamLibrary = async (steamId: string): Promise<Game[]> => {
  try {
    console.log('🎮 Obteniendo biblioteca real de Steam para:', steamId);
    
    // Por ahora devolvemos los juegos populares con datos reales
    // En el futuro esto consultará la API real de Steam del usuario
    return await fetchGames();
  } catch (error) {
    console.error('Error fetching Steam library:', error);
    throw error;
  }
};

/**
 * Enrich game data con fetchGameMetrics - ya no es necesario porque fetchGames ya devuelve datos enriquecidos
 */
export const enrichGameData = async (games: Game[]): Promise<Game[]> => {
  // Los datos ya vienen enriquecidos de fetchGames, simplemente devolvemos tal como están
  console.log('✅ Datos ya enriquecidos con fetchGameMetrics');
  return games;
};

/**
 * Save games to database
 * TODO: Implement Supabase integration
 */
export const saveGamesToDatabase = async (userId: string, games: Game[]): Promise<void> => {
  try {
    console.log('Saving games to database for user:', userId);
    
    // This will save enriched game data to Supabase
    // Implementation pending Supabase configuration
  } catch (error) {
    console.error('Error saving games to database:', error);
    throw error;
  }
};

// Export services for direct use if needed
export {
  SupabaseService
};