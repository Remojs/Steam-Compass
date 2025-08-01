import { getMetacriticScores, searchMetacriticVariations } from './metacriticService.js';
import { getSteamReviews, getSteamGameDetails } from './steamService.js';

/**
 * Servicio principal que obtiene todas las métricas de un juego
 */
export async function fetchCompleteGameMetrics(appid, gameName, playtime_minutes = 0) {
  console.log(`\n🎮 [Backend Principal] Iniciando obtención completa para: ${gameName} (${appid})`);
  
  try {
    // Ejecutar todas las búsquedas en paralelo para mayor velocidad
    const [
      metacriticScores,
      steamReviews,
      steamDetails
    ] = await Promise.allSettled([
      searchMetacriticVariations(gameName),
      getSteamReviews(appid),
      getSteamGameDetails(appid)
    ]);
    
    // Extraer resultados (con valores por defecto si fallan)
    const { metascore, userscore } = metacriticScores.status === 'fulfilled' 
      ? metacriticScores.value 
      : { metascore: null, userscore: null };
    const { total_positive, total_negative } = steamReviews.status === 'fulfilled' 
      ? steamReviews.value 
      : { total_positive: 0, total_negative: 0 };
    const gameDetails = steamDetails.status === 'fulfilled' ? steamDetails.value : null;
    
    // Calcular estrellas basado en múltiples factores (sin HLTB)
    const stars = calculateStars(0, metascore, total_positive, total_negative);
    
    // Usar playtime como fuente principal de horas
    const finalHours = Math.round(playtime_minutes / 60);
    
    const result = {
      appid,
      name: gameName,
      horas: finalHours,
      metascore,
      userscore,
      total_positive,
      total_negative,
      stars,
      steamDetails: gameDetails
    };
    
    console.log(`✅ [Backend Principal] Métricas completas para ${gameName}:`, {
      horas: result.horas,
      metascore: result.metascore,
      userscore: result.userscore,
      reviews: `+${result.total_positive}/-${result.total_negative}`,
      stars: result.stars
    });
    
    return result;
    
  } catch (error) {
    console.error(`❌ [Backend Principal] Error crítico para ${gameName}:`, error);
    
    // Devolver estructura básica en caso de error completo
    return {
      appid,
      name: gameName,
      horas: Math.round(playtime_minutes / 60),
      metascore: null,
      userscore: null,
      total_positive: 0,
      total_negative: 0,
      stars: 0,
      steamDetails: null,
      error: error.message
    };
  }
}

/**
 * Calcular estrellas (0-5) basado en Metacritic y Steam Reviews
 */
function calculateStars(horas, metascore, total_positive, total_negative) {
  console.log(`⭐ [Backend] Calculando estrellas: metascore=${metascore}, +${total_positive}, -${total_negative}`);
  
  // Evitar división por cero
  const totalReviews = total_positive + total_negative;
  
  // Ratio de reviews positivas (0-1)
  const posRatio = totalReviews > 0 ? total_positive / totalReviews : 0.5;
  
  // Ratio de Metacritic (0-1)
  const mcRatio = metascore ? metascore / 100 : 0.5;
  
  // Fórmula ponderada (50% Metacritic, 50% Steam Reviews)
  const rawScore = (0.5 * mcRatio) + (0.5 * posRatio);
  
  // Convertir a escala 0-5 y redondear
  const stars = Math.round(rawScore * 5 * 10) / 10;
  
  console.log(`✅ [Backend] Estrellas calculadas: posRatio=${posRatio.toFixed(2)}, mcRatio=${mcRatio.toFixed(2)} → ${stars}⭐`);
  
  return Math.max(0, Math.min(5, stars));
}

/**
 * Versión optimizada para obtener solo datos esenciales (más rápida)
 */
export async function fetchEssentialGameMetrics(appid, gameName) {
  console.log(`\n🚀 [Backend Rápido] Obteniendo datos esenciales para: ${gameName}`);
  
  try {
    // Solo obtener las métricas de Steam (más rápido)
    const [steamReviews] = await Promise.allSettled([
      getSteamReviews(appid)
    ]);
    
    const { total_positive, total_negative } = steamReviews.status === 'fulfilled' 
      ? steamReviews.value 
      : { total_positive: 0, total_negative: 0 };
    
    const stars = calculateStars(0, null, total_positive, total_negative);
    
    return {
      appid,
      name: gameName,
      horas: 0, // Sin HLTB, no tenemos horas estimadas en modo rápido
      total_positive,
      total_negative,
      stars
    };
    
  } catch (error) {
    console.error(`❌ [Backend Rápido] Error para ${gameName}:`, error);
    return {
      appid,
      name: gameName,
      horas: 0,
      total_positive: 0,
      total_negative: 0,
      stars: 0,
      error: error.message
    };
  }
}
