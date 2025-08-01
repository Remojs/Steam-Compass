interface MetacriticResult {
  name: string;
  score: number;
  platform: string;
}

interface HowLongToBeatResult {
  name: string;
  main_story: number;
  main_extra: number;
  completionist: number;
}

export class GameMetadataService {
  /**
   * Buscar score de Metacritic usando web scraping (método más confiable)
   */
  static async getMetacriticScore(gameName: string): Promise<number | null> {
    try {
      // Limpiar nombre del juego para búsqueda
      const cleanName = this.cleanGameName(gameName);
      
      // Usar una API de scraping público o búsqueda directa
      // Como alternativa, podemos usar OpenCritic API que es más accesible
      const searchUrl = `https://api.opencritic.com/api/game/search?criteria=${encodeURIComponent(cleanName)}`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const results = await response.json();
      
      if (results && results.length > 0) {
        const game = results[0];
        // OpenCritic usa una escala similar a Metacritic
        return Math.round(game.averageScore || game.topCriticScore || 0);
      }
      
      return null;
    } catch (error) {
      console.log(`No se pudo obtener score de Metacritic/OpenCritic para ${gameName}:`, error);
      return null;
    }
  }

  /**
   * Obtener tiempo de completación usando HowLongToBeat
   */
  static async getCompletionTime(gameName: string): Promise<number | null> {
    try {
      const cleanName = this.cleanGameName(gameName);
      
      // Usar la API de HowLongToBeat (no oficial pero funcional)
      const searchUrl = `https://howlongtobeat.com/api/search`;
      
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          searchType: 'games',
          searchTerms: [cleanName],
          searchPage: 1,
          size: 1
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const game = data.data[0];
        // Priorizar Main Story, luego Main + Extra
        return game.comp_main || game.comp_plus || game.comp_100 || null;
      }
      
      return null;
    } catch (error) {
      console.log(`No se pudo obtener tiempo de HowLongToBeat para ${gameName}:`, error);
      return null;
    }
  }

  /**
   * Obtener datos completos del juego desde múltiples fuentes
   */
  static async getGameMetadata(gameName: string, appId?: number): Promise<{
    metacritic_score: number | null;
    completion_time: number | null;
    steam_score: number | null;
  }> {
    const results = await Promise.allSettled([
      this.getMetacriticScore(gameName),
      this.getCompletionTime(gameName),
      appId ? this.getSteamStoreData(appId) : null
    ]);

    return {
      metacritic_score: results[0].status === 'fulfilled' ? results[0].value : null,
      completion_time: results[1].status === 'fulfilled' ? results[1].value : null,
      steam_score: results[2].status === 'fulfilled' ? results[2].value?.metacritic_score : null
    };
  }

  /**
   * Obtener datos de Steam Store (como fallback)
   */
  static async getSteamStoreData(appId: number): Promise<{metacritic_score: number | null} | null> {
    try {
      const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=metacritic`;
      
      // Usar proxy CORS
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const text = await response.text();
      if (text.trim().startsWith('<')) {
        throw new Error('Respuesta HTML en lugar de JSON');
      }
      
      const data = JSON.parse(text);
      
      if (data[appId] && data[appId].success && data[appId].data) {
        const gameData = data[appId].data;
        return {
          metacritic_score: gameData.metacritic?.score || null
        };
      }
      
      return null;
    } catch (error) {
      console.log(`Error obteniendo datos de Steam Store para appId ${appId}:`, error);
      return null;
    }
  }

  /**
   * Limpiar nombre del juego para búsquedas más precisas
   */
  static cleanGameName(gameName: string): string {
    return gameName
      .replace(/[™®©]/g, '') // Quitar símbolos de marca
      .replace(/\s*\([^)]*\)/g, '') // Quitar texto entre paréntesis
      .replace(/\s*\[[^\]]*\]/g, '') // Quitar texto entre corchetes
      .replace(/:\s*[^:]*$/g, '') // Quitar subtítulos después de ":"
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Base de datos de scores conocidos para casos comunes
   */
  static getKnownScore(gameName: string): number | null {
    const knownScores: Record<string, number> = {
      'elden ring': 96,
      'the witcher 3': 93,
      'cyberpunk 2077': 77,
      'god of war': 94,
      'horizon zero dawn': 89,
      'dark souls iii': 89,
      'bloodborne': 92,
      'sekiro': 90,
      'grand theft auto v': 96,
      'red dead redemption 2': 97,
      'call of duty: modern warfare': 81,
      'battlefield 1': 89,
      'destiny 2': 85,
      'overwatch': 90,
      'counter-strike 2': 83,
      'dota 2': 90,
      'league of legends': 78,
      'minecraft': 93,
      'terraria': 83,
      'stardew valley': 89,
      'hollow knight': 90,
      'celeste': 94
    };

    const cleanName = this.cleanGameName(gameName).toLowerCase();
    
    // Buscar coincidencia exacta
    if (knownScores[cleanName]) {
      return knownScores[cleanName];
    }

    // Buscar coincidencia parcial
    for (const [known, score] of Object.entries(knownScores)) {
      if (cleanName.includes(known) || known.includes(cleanName)) {
        return score;
      }
    }

    return null;
  }

  /**
   * Base de datos de tiempos conocidos para casos comunes (en horas)
   */
  static getKnownCompletionTime(gameName: string): number | null {
    const knownTimes: Record<string, number> = {
      'elden ring': 54,
      'the witcher 3': 51,
      'cyberpunk 2077': 24,
      'god of war': 20,
      'horizon zero dawn': 22,
      'dark souls iii': 32,
      'bloodborne': 33,
      'sekiro': 30,
      'grand theft auto v': 31,
      'red dead redemption 2': 50,
      'call of duty: modern warfare': 6,
      'battlefield 1': 7,
      'destiny 2': 12,
      'overwatch': 0, // Multijugador
      'counter-strike 2': 0, // Multijugador
      'dota 2': 0, // Multijugador
      'league of legends': 0, // Multijugador
      'minecraft': 0, // Sandbox
      'terraria': 51,
      'stardew valley': 52,
      'hollow knight': 27,
      'celeste': 8
    };

    const cleanName = this.cleanGameName(gameName).toLowerCase();
    
    // Buscar coincidencia exacta
    if (knownTimes[cleanName] !== undefined) {
      return knownTimes[cleanName];
    }

    // Buscar coincidencia parcial
    for (const [known, time] of Object.entries(knownTimes)) {
      if (cleanName.includes(known) || known.includes(cleanName)) {
        return time;
      }
    }

    return null;
  }

  /**
   * Método principal que combina todas las fuentes
   */
  static async getCompleteGameData(gameName: string, appId?: number): Promise<{
    metacritic_score: number;
    completion_time: number;
  }> {
    // Primero intentar con base de datos conocida
    let metacriticScore = this.getKnownScore(gameName);
    let completionTime = this.getKnownCompletionTime(gameName);

    // Si no está en la base conocida, buscar en APIs
    if (!metacriticScore || !completionTime) {
      const apiData = await this.getGameMetadata(gameName, appId);
      
      metacriticScore = metacriticScore || apiData.metacritic_score || apiData.steam_score || 75;
      completionTime = completionTime || apiData.completion_time || this.estimateTimeByGenre(gameName);
    }

    return {
      metacritic_score: metacriticScore || 75,
      completion_time: completionTime || 15
    };
  }

  /**
   * Estimación de tiempo por género como último recurso
   */
  static estimateTimeByGenre(gameName: string): number {
    const name = gameName.toLowerCase();
    
    if (name.includes('call of duty') || name.includes('battlefield')) return 7;
    if (name.includes('rpg') || name.includes('witcher') || name.includes('elder scrolls')) return 45;
    if (name.includes('souls') || name.includes('elden')) return 35;
    if (name.includes('puzzle') || name.includes('indie')) return 8;
    if (name.includes('strategy') || name.includes('civilization')) return 20;
    if (name.includes('racing') || name.includes('sport')) return 12;
    if (name.includes('platform')) return 10;
    
    return 15; // Valor por defecto
  }
}
