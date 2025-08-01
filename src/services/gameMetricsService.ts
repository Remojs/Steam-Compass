import { GameDataResult } from '../lib/types';

// URL del backend API
const API_BASE_URL = 'http://localhost:3001';

interface FetchGameMetricsParams {
  appid: number;
  name: string;
  playtime_minutes?: number;
}

/**
 * Función principal que obtiene métricas desde nuestro backend
 */
export async function fetchGameMetrics({ 
  appid, 
  name, 
  playtime_minutes = 0 
}: FetchGameMetricsParams): Promise<GameDataResult> {
  console.log(`🎮 [Frontend] Solicitando métricas para: ${name} (${appid})`);
  
  try {
    // Llamar a nuestro backend API
    const url = `${API_BASE_URL}/api/get-game-details?name=${encodeURIComponent(name)}&appid=${appid}&mode=complete`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API failed with status ${response.status}`);
    }

    const apiResponse = await response.json();
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Backend API returned error');
    }

    const data = apiResponse.data;

    // Mapear la respuesta del backend a nuestro formato
    const result: GameDataResult = {
      appid,
      name,
      horas: data.horas || Math.round(playtime_minutes / 60),
      metascore: data.metascore,
      userscore: data.userscore,
      total_positive: data.total_positive || 0,
      total_negative: data.total_negative || 0,
      stars: data.stars || 0
    };
    
    console.log(`✅ [Frontend] Métricas recibidas para ${name}:`, {
      horas: result.horas,
      metascore: result.metascore,
      reviews: `+${result.total_positive}/-${result.total_negative}`,
      stars: result.stars
    });
    
    return result;

  } catch (error) {
    console.error(`❌ [Frontend] Error obteniendo métricas para ${name}:`, error);
    
    // Devolver un objeto con valores por defecto en caso de error
    return {
      appid,
      name,
      horas: Math.round(playtime_minutes / 60),
      metascore: null,
      userscore: null,
      total_positive: 0,
      total_negative: 0,
      stars: 0
    };
  }
}

export default fetchGameMetrics;
