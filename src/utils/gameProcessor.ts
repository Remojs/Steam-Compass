// Ejemplo de integración de fetchGameMetrics en el Dashboard
// Este archivo muestra cómo usar la nueva función

import { fetchGameMetrics } from '../services/gameMetricsService';
import { GameDataResult, SteamGame } from '../lib/types';

/**
 * Ejemplo de cómo usar fetchGameMetrics en el Dashboard
 */
export async function processUserGames(steamGames: SteamGame[]): Promise<GameDataResult[]> {
  console.log(`📊 Procesando ${steamGames.length} juegos con fetchGameMetrics`);
  
  const results: GameDataResult[] = [];
  const BATCH_SIZE = 3; // Procesar de a 3 para no sobrecargar APIs
  const DELAY_MS = 2000; // 2 segundos entre lotes
  
  for (let i = 0; i < steamGames.length; i += BATCH_SIZE) {
    const batch = steamGames.slice(i, i + BATCH_SIZE);
    console.log(`🔄 Procesando lote ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(steamGames.length/BATCH_SIZE)}`);
    
    const batchPromises = batch.map(async (game) => {
      try {
        return await fetchGameMetrics({
          appid: game.appid,
          name: game.name,
          playtime_minutes: game.playtime_forever
        });
      } catch (error) {
        console.error(`❌ Error procesando ${game.name}:`, error);
        // Devolver datos básicos en caso de error
        return {
          appid: game.appid,
          name: game.name,
          horas: Math.round(game.playtime_forever / 60),
          metascore: null,
          userscore: null,
          total_positive: 0,
          total_negative: 0,
          stars: 3.0 // Neutral
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Pausa entre lotes
    if (i + BATCH_SIZE < steamGames.length) {
      console.log(`⏳ Esperando ${DELAY_MS}ms antes del siguiente lote...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  console.log(`✅ Procesamiento completado: ${results.length} juegos procesados`);
  return results;
}

/**
 * Ejemplo de cómo procesar un juego individual
 */
export async function processIndividualGame(appid: number, name: string, playtime_minutes: number): Promise<GameDataResult> {
  console.log(`🎮 Procesando juego individual: ${name}`);
  
  try {
    const result = await fetchGameMetrics({
      appid,
      name,
      playtime_minutes
    });
    
    console.log(`✅ Juego procesado exitosamente:`, {
      name: result.name,
      horas: result.horas,
      metascore: result.metascore,
      stars: result.stars,
      reviews: `+${result.total_positive} -${result.total_negative}`
    });
    
    return result;
    
  } catch (error) {
    console.error(`❌ Error procesando ${name}:`, error);
    throw error;
  }
}

/**
 * Función helper para convertir GameDataResult a formato del Dashboard
 */
export function convertToGameFormat(gameData: GameDataResult) {
  const positivePercentage = gameData.total_positive + gameData.total_negative > 0
    ? Math.round((gameData.total_positive / (gameData.total_positive + gameData.total_negative)) * 100)
    : 0;
    
  return {
    id: gameData.appid.toString(),
    name: gameData.name,
    cover: `https://steamcdn-a.akamaihd.net/steam/apps/${gameData.appid}/header.jpg`,
    estimatedHours: Math.round(gameData.horas),
    metascore: gameData.metascore || 0,
    stars: gameData.stars,
    positivePercentage,
    hoursToComplete: gameData.horas,
    qualityPerHour: gameData.metascore && gameData.horas > 0 
      ? Math.round((gameData.metascore / gameData.horas) * 100) / 100 
      : 0,
    hasPlatinum: false
  };
}

// Ejemplo de uso en el Dashboard:
/*
// En Dashboard.tsx, reemplazar la lógica de carga:

const handleSyncFromSteam = async () => {
  try {
    setIsLoading(true);
    
    // 1. Obtener juegos de Steam
    const steamGames = await SteamService.getUserGames(steamId);
    
    // 2. Procesar con fetchGameMetrics
    const processedGames = await processUserGames(steamGames);
    
    // 3. Convertir al formato del Dashboard
    const dashboardGames = processedGames.map(convertToGameFormat);
    
    // 4. Guardar en la base de datos y actualizar UI
    setGames(dashboardGames);
    
  } catch (error) {
    console.error('Error syncing games:', error);
  } finally {
    setIsLoading(false);
  }
};
*/
