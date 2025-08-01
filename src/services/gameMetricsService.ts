import * as cheerio from 'cheerio';
import { GameDataResult } from '../lib/types';

// Configuración
const HORAS_MAX = 100; // Ajusta según prefieras para el cálculo de estrellas

interface FetchGameMetricsParams {
  appid: number;
  name: string;
  playtime_minutes?: number;
}

interface HLTBGameResult {
  game_name: string;
  comp_main: number;
  comp_plus: number;
  comp_100: number;
}

/**
 * Función principal que reúne métricas fiables de múltiples fuentes
 */
export async function fetchGameMetrics({ 
  appid, 
  name, 
  playtime_minutes = 0 
}: FetchGameMetricsParams): Promise<GameDataResult> {
  console.log(`🎮 Obteniendo métricas para: ${name} (${appid})`);
  
  // 1) Horas de historia principal con HowLongToBeat
  const horas = await getMainStoryHours(name, playtime_minutes);
  
  // 2) Metacritic scores
  const { metascore, userscore } = await getMetacriticScores(name);
  
  // 3) Steam Reviews
  const { total_positive, total_negative } = await getSteamReviews(appid);
  
  // 4) Cálculo de estrellas
  const stars = calculateStars(horas, metascore, total_positive, total_negative);
  
  const result: GameDataResult = {
    appid,
    name,
    horas,
    metascore,
    userscore,
    total_positive,
    total_negative,
    stars
  };
  
  console.log(`✅ Métricas obtenidas para ${name}:`, result);
  return result;
}

/**
 * 1) Obtener horas de historia principal usando HowLongToBeat vía proxy
 */
async function getMainStoryHours(name: string, playtime_minutes: number): Promise<number> {
  try {
    console.log(`🕐 Buscando horas principales para: ${name}`);
    
    // Implementación directa a la API de HowLongToBeat vía proxy
    const searchPayload = {
      searchType: "games",
      searchTerms: [name],
      searchPage: 1,
      size: 20,
      searchOptions: {
        games: {
          userId: 0,
          platform: "",
          sortCategory: "popular",
          rangeCategory: "main",
          rangeTime: {
            min: 0,
            max: 0
          },
          gameplay: {
            perspective: "",
            flow: "",
            genre: ""
          },
          modifier: ""
        },
        users: {
          sortCategory: "postcount"
        },
        filter: "",
        sort: 0,
        randomizer: 0
      }
    };
    
    const response = await fetch('/api/hltb/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://howlongtobeat.com',
        'Origin': 'https://howlongtobeat.com'
      },
      body: JSON.stringify(searchPayload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.data && data.data.length > 0) {
      console.log(`📋 Resultados encontrados para ${name}:`, data.data.map((r: HLTBGameResult) => ({
        game_name: r.game_name,
        comp_main: r.comp_main,
        comp_plus: r.comp_plus,
        comp_100: r.comp_100
      })));
      
      // Encuentra coincidencia exacta o usa el primer resultado
      const juego = data.data.find((j: HLTBGameResult) => 
        j.game_name.toLowerCase().includes(name.toLowerCase().split(' ')[0]) || 
        name.toLowerCase().includes(j.game_name.toLowerCase().split(' ')[0])
      ) || data.data[0];
      
      const horasMain = juego.comp_main;
      
      console.log(`🎯 Juego seleccionado para ${name}:`, {
        selectedGame: juego.game_name,
        comp_main: horasMain,
        comp_plus: juego.comp_plus,
        comp_100: juego.comp_100
      });
      
      if (horasMain != null && horasMain > 0) {
        console.log(`✅ Horas principales encontradas: ${horasMain}h para ${name} (desde ${juego.game_name})`);
        return horasMain;
      }
    }
    
    // Fallback a horas jugadas de Steam
    const fallbackHours = Math.round(playtime_minutes / 60);
    console.log(`⚠️ No se encontraron datos HLTB para ${name}, usando fallback: ${fallbackHours}h`);
    return fallbackHours;
    
  } catch (error) {
    console.error(`❌ Error obteniendo horas HLTB para ${name}:`, error);
    return Math.round(playtime_minutes / 60);
  }
}

/**
 * 2) Obtener Metascore y User Score de Metacritic
 */
async function getMetacriticScores(name: string): Promise<{ metascore: number | null; userscore: number | null }> {
  try {
    console.log(`🎯 Obteniendo scores de Metacritic para: ${name}`);
    
    // Normaliza el slug: minúsculas, guiones, sin caracteres especiales
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const url = `/api/metacritic/game/pc/${slug}`;
    console.log(`📡 Consultando: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️ Metacritic response ${response.status} para ${name}`);
      return { metascore: null, userscore: null };
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Buscar metascore
    const metascoreText = $('.metascore_w.xlarge.game .score').first().text().trim();
    const metascore = metascoreText ? parseInt(metascoreText, 10) : null;
    
    // Buscar user score
    const userscoreText = $('.metascore_w.user.medium.game .score').first().text().trim();
    const userscore = userscoreText ? parseFloat(userscoreText) : null;
    
    console.log(`✅ Metacritic para ${name}: Metascore=${metascore}, Userscore=${userscore}`);
    return { metascore, userscore };
    
  } catch (error) {
    console.error(`❌ Error obteniendo Metacritic para ${name}:`, error);
    return { metascore: null, userscore: null };
  }
}

/**
 * 3) Obtener Steam Reviews (positivas/negativas)
 */
async function getSteamReviews(appid: number): Promise<{ total_positive: number; total_negative: number }> {
  try {
    console.log(`📝 Obteniendo reviews de Steam para appid: ${appid}`);
    
    const url = `/api/steam/appreviews/${appid}?json=1&language=all&filter=all&day_range=365&review_type=all&purchase_type=all&page_size=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`⚠️ Steam Reviews response ${response.status} para appid: ${appid}`);
      return { total_positive: 0, total_negative: 0 };
    }
    
    const reviews = await response.json();
    const { total_positive = 0, total_negative = 0 } = reviews.query_summary || {};
    
    console.log(`✅ Steam Reviews para appid ${appid}: +${total_positive}, -${total_negative}`);
    return { total_positive, total_negative };
    
  } catch (error) {
    console.error(`❌ Error obteniendo Steam Reviews para appid ${appid}:`, error);
    return { total_positive: 0, total_negative: 0 };
  }
}

/**
 * 4) Calcular estrellas (0-5) basado en múltiples factores
 */
function calculateStars(
  horas: number, 
  metascore: number | null, 
  total_positive: number, 
  total_negative: number
): number {
  console.log(`⭐ Calculando estrellas: horas=${horas}, metascore=${metascore}, +${total_positive}, -${total_negative}`);
  
  // Ratio de reviews positivas
  const posRatio = total_positive / (total_positive + total_negative || 1);
  
  // Ratio de Metacritic (0-1)
  const mcRatio = (metascore || 0) / 100;
  
  // Factor de duración (penaliza juegos muy largos)
  const durationFactor = Math.max(0, 1 - horas / HORAS_MAX);
  
  // Fórmula de estrellas ajustada según tus pesos
  const rawScore = 0.4 * mcRatio + 0.3 * posRatio + 0.3 * durationFactor;
  
  // Convertir a escala 0-5 y redondear a 1 decimal
  const stars = Math.round(rawScore * 5 * 10) / 10;
  
  console.log(`✅ Cálculo estrellas: posRatio=${posRatio.toFixed(2)}, mcRatio=${mcRatio.toFixed(2)}, durationFactor=${durationFactor.toFixed(2)} → ${stars}⭐`);
  
  return Math.max(0, Math.min(5, stars));
}

export default fetchGameMetrics;
