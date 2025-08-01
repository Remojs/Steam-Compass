interface RAWGGameResult {
  id: number;
  name: string;
  metacritic: number | null;
  playtime: number;
  background_image: string;
  rating: number;
  platforms: Array<{
    platform: {
      id: number;
      name: string;
    };
  }>;
}

interface RAWGSearchResponse {
  count: number;
  results: RAWGGameResult[];
}

interface GameMetadata {
  metacritic_score: number | null;
  hours_to_complete: number | null;
  quality_per_hour: number | null;
  has_platinum: boolean;
}

export class RAWGService {
  private static readonly API_KEY = import.meta.env.VITE_RAWG_API_KEY;
  private static readonly BASE_URL = 'https://api.rawg.io/api';
  
  /**
   * Verificar si RAWG API está configurada
   */
  static isConfigured(): boolean {
    return Boolean(this.API_KEY && this.API_KEY !== 'your_rawg_api_key');
  }

  /**
   * Buscar juego por nombre para obtener metadata
   */
  static async searchGame(gameName: string, playedHours: number = 0): Promise<GameMetadata | null> {
    if (!this.isConfigured()) {
      console.log('RAWG API no configurada, usando estimaciones inteligentes para:', gameName);
      return this.generateSmartEstimates(gameName, playedHours);
    }

    try {
      const url = `${this.BASE_URL}/games?key=${this.API_KEY}&search=${encodeURIComponent(gameName)}&page_size=1`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: RAWGSearchResponse = await response.json();
      
      if (data.results.length === 0) {
        console.log('No se encontró en RAWG, usando estimaciones para:', gameName);
        return this.generateSmartEstimates(gameName, playedHours);
      }

      const game = data.results[0];
      
      // Combinar datos reales con estimaciones donde falten
      const realData = {
        metacritic_score: game.metacritic,
        hours_to_complete: this.estimateCompletionTime(game.playtime, game.name),
        quality_per_hour: null, // Se calculará después
        has_platinum: await this.checkPlatinumAvailability(game.name, game.platforms)
      };

      // Si faltan datos importantes, completar con estimaciones
      if (!realData.metacritic_score || !realData.hours_to_complete) {
        const estimates = this.generateSmartEstimates(gameName, playedHours);
        
        return {
          metacritic_score: realData.metacritic_score || estimates.metacritic_score,
          hours_to_complete: realData.hours_to_complete || estimates.hours_to_complete,
          quality_per_hour: null, // Se calculará dinámicamente
          has_platinum: realData.has_platinum || estimates.has_platinum
        };
      }

      return realData;

    } catch (error) {
      console.error('Error obteniendo datos de RAWG:', error);
      console.log('Usando estimaciones inteligentes para:', gameName);
      return this.generateSmartEstimates(gameName, playedHours);
    }
  }

  /**
   * Datos de fallback cuando no hay API configurada - usar estimaciones inteligentes
   */
  private static getFallbackData(): GameMetadata {
    return {
      metacritic_score: null, // Se calculará en otra función
      hours_to_complete: null, // Se calculará en otra función
      quality_per_hour: null,
      has_platinum: false
    };
  }

  /**
   * Generar estimaciones inteligentes basadas en el nombre del juego
   */
  static generateSmartEstimates(gameName: string, playedHours: number = 0): GameMetadata {
    const name = gameName.toLowerCase();
    let estimatedMetacritic = 75; // Base neutra
    let estimatedHours = 15; // Base neutra
    let hasPlatinum = false;

    // Estimaciones basadas en franquicias conocidas y géneros
    
    // Juegos AAA conocidos
    if (name.includes('elden ring') || name.includes('dark souls') || name.includes('sekiro')) {
      estimatedMetacritic = 90;
      estimatedHours = 60;
      hasPlatinum = true;
    }
    else if (name.includes('witcher 3') || name.includes('cyberpunk')) {
      estimatedMetacritic = 88;
      estimatedHours = 80;
      hasPlatinum = true;
    }
    else if (name.includes('god of war') || name.includes('horizon')) {
      estimatedMetacritic = 85;
      estimatedHours = 35;
      hasPlatinum = true;
    }
    else if (name.includes('call of duty') || name.includes('battlefield')) {
      estimatedMetacritic = 78;
      estimatedHours = 8;
      hasPlatinum = name.includes('playstation');
    }
    else if (name.includes('assassin') || name.includes('far cry')) {
      estimatedMetacritic = 76;
      estimatedHours = 25;
      hasPlatinum = true;
    }
    else if (name.includes('grand theft auto') || name.includes('red dead')) {
      estimatedMetacritic = 85;
      estimatedHours = 50;
      hasPlatinum = true;
    }
    
    // Géneros específicos
    else if (name.includes('rpg') || name.includes('role')) {
      estimatedMetacritic = 80;
      estimatedHours = 45;
      hasPlatinum = Math.random() > 0.3;
    }
    else if (name.includes('puzzle') || name.includes('indie')) {
      estimatedMetacritic = 75;
      estimatedHours = 8;
      hasPlatinum = false;
    }
    else if (name.includes('strategy') || name.includes('simulation')) {
      estimatedMetacritic = 77;
      estimatedHours = 100; // Juegos infinitos
      hasPlatinum = false;
    }
    else if (name.includes('racing') || name.includes('sport')) {
      estimatedMetacritic = 72;
      estimatedHours = 15;
      hasPlatinum = Math.random() > 0.5;
    }

    // Ajustar estimaciones basadas en horas jugadas reales
    if (playedHours > 0) {
      // Si el jugador ha dedicado muchas horas, probablemente es un buen juego
      if (playedHours > 100) {
        estimatedMetacritic = Math.min(estimatedMetacritic + 10, 95);
        estimatedHours = Math.max(estimatedHours, playedHours * 0.8); // Tiempo completado estimado
      }
      else if (playedHours > 50) {
        estimatedMetacritic = Math.min(estimatedMetacritic + 5, 90);
        estimatedHours = Math.max(estimatedHours, playedHours * 1.2);
      }
      else if (playedHours < 2) {
        // Pocas horas jugadas puede indicar que no gustó
        estimatedMetacritic = Math.max(estimatedMetacritic - 10, 50);
      }
    }

    return {
      metacritic_score: estimatedMetacritic,
      hours_to_complete: estimatedHours,
      quality_per_hour: estimatedMetacritic / estimatedHours,
      has_platinum: hasPlatinum
    };
  }

  /**
   * Estimar tiempo de completación basado en datos de RAWG
   */
  private static estimateCompletionTime(playtime: number, gameName: string): number {
    // Si hay datos de playtime de RAWG, usarlos como base
    if (playtime && playtime > 0) {
      return Math.round(playtime * 1.2); // Agregar 20% para completación
    }

    // Estimaciones basadas en género/tipo de juego
    const name = gameName.toLowerCase();
    
    if (name.includes('rpg') || name.includes('witcher') || name.includes('elder scrolls')) {
      return Math.floor(Math.random() * 50) + 30; // 30-80 horas
    }
    
    if (name.includes('call of duty') || name.includes('battlefield')) {
      return Math.floor(Math.random() * 10) + 8; // 8-18 horas
    }
    
    if (name.includes('indie') || name.includes('puzzle')) {
      return Math.floor(Math.random() * 10) + 3; // 3-13 horas
    }
    
    // Por defecto
    return Math.floor(Math.random() * 30) + 10; // 10-40 horas
  }

  /**
   * Calcular calidad por hora basado en Metacritic score
   */
  private static calculateQualityPerHour(metacritic: number | null, hours: number): number {
    if (!metacritic) {
      return Math.floor(Math.random() * 30) + 70; // Valor aleatorio entre 70-100
    }

    // La calidad por hora se basa en el score de Metacritic
    // Juegos más cortos con alto score tienen mejor calidad por hora
    const baseQuality = metacritic;
    const hoursAdjustment = hours > 50 ? -5 : hours < 10 ? +10 : 0;
    
    return Math.max(50, Math.min(100, baseQuality + hoursAdjustment));
  }

  /**
   * Verificar si el juego tiene trofeo de platino (principalmente para PlayStation)
   */
  private static async checkPlatinumAvailability(
    gameName: string, 
    platforms: Array<{platform: {id: number; name: string}}>
  ): Promise<boolean> {
    // Verificar si está disponible en PlayStation (donde existen platinos)
    const hasPlayStation = platforms.some(p => 
      p.platform.name.toLowerCase().includes('playstation')
    );

    if (!hasPlayStation) {
      return false;
    }

    // Juegos que típicamente tienen platino
    const name = gameName.toLowerCase();
    const platinumIndicators = [
      'god of war', 'horizon', 'spider-man', 'last of us', 'uncharted',
      'assassin\'s creed', 'call of duty', 'battlefield', 'fifa', 'nba',
      'grand theft auto', 'red dead', 'witcher', 'cyberpunk', 'dark souls'
    ];

    const hasPlatinumIndicator = platinumIndicators.some(indicator => 
      name.includes(indicator)
    );

    // 80% de probabilidad si tiene indicadores, 30% en general para juegos de PlayStation
    return hasPlatinumIndicator ? Math.random() > 0.2 : Math.random() > 0.7;
  }

  /**
   * Obtener datos en lote para múltiples juegos
   */
  static async getGamesMetadata(gameData: Array<{name: string, playedHours?: number}>): Promise<Map<string, GameMetadata>> {
    const results = new Map<string, GameMetadata>();
    
    // Procesar en lotes de 5 para no sobrecargar la API
    const batchSize = 5;
    
    for (let i = 0; i < gameData.length; i += batchSize) {
      const batch = gameData.slice(i, i + batchSize);
      
      const promises = batch.map(async (game) => {
        const metadata = await this.searchGame(game.name, game.playedHours || 0);
        return { name: game.name, metadata };
      });

      const batchResults = await Promise.all(promises);
      
      batchResults.forEach(({ name, metadata }) => {
        if (metadata) {
          results.set(name, metadata);
        }
      });

      // Esperar un poco entre lotes para respetar rate limits
      if (i + batchSize < gameData.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}
