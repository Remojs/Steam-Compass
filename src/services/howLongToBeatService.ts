import { HowLongToBeatService, HowLongToBeatEntry } from 'howlongtobeat';

export interface CompletionTimes {
  main: number | null;
  mainExtra: number | null;
  completionist: number | null;
  average: number | null;
}

class HowLongToBeatAPI {
  private hltb: HowLongToBeatService;

  constructor() {
    this.hltb = new HowLongToBeatService();
  }

  /**
   * Buscar tiempos de completación para un juego
   */
  async getCompletionTimes(gameName: string): Promise<CompletionTimes> {
    try {
      console.log(`🕐 Buscando tiempos de completación para: ${gameName}`);
      
      // Limpiar nombre del juego para mejor búsqueda
      const cleanName = this.cleanGameName(gameName);
      
      const results = await this.hltb.search(cleanName);
      
      if (results && results.length > 0) {
        // Buscar la mejor coincidencia
        const bestMatch = this.findBestMatch(cleanName, results);
        
        if (bestMatch) {
          const times: CompletionTimes = {
            main: bestMatch.gameplayMain > 0 ? bestMatch.gameplayMain : null,
            mainExtra: bestMatch.gameplayMainExtra > 0 ? bestMatch.gameplayMainExtra : null,
            completionist: bestMatch.gameplayCompletionist > 0 ? bestMatch.gameplayCompletionist : null,
            average: null
          };

          // Usar Main Story como principal, luego Main + Extra como backup
          let primaryTime = times.main;
          if (!primaryTime && times.mainExtra) {
            primaryTime = times.mainExtra;
          }
          if (!primaryTime && times.completionist) {
            primaryTime = times.completionist;
          }

          times.average = primaryTime;

          console.log(`✅ Tiempos encontrados para ${gameName}:`, {
            main: times.main,
            mainExtra: times.mainExtra,
            completionist: times.completionist,
            selected: times.average,
            sourceMatch: bestMatch.name
          });
          return times;
        }
      }
      
      console.log(`⚠️ No se encontraron tiempos para ${gameName}`);
      return {
        main: null,
        mainExtra: null,
        completionist: null,
        average: null
      };
      
    } catch (error) {
      console.error(`❌ Error obteniendo tiempos de ${gameName}:`, error);
      return {
        main: null,
        mainExtra: null,
        completionist: null,
        average: null
      };
    }
  }

  /**
   * Encontrar la mejor coincidencia en los resultados
   */
  private findBestMatch(searchTerm: string, results: HowLongToBeatEntry[]): HowLongToBeatEntry | null {
    if (!results || results.length === 0) return null;

    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // Buscar coincidencia exacta
    for (const result of results) {
      const normalizedResult = result.name.toLowerCase().trim();
      if (normalizedResult === normalizedSearch) {
        console.log(`🎯 Coincidencia exacta: "${result.name}" para "${searchTerm}"`);
        return result;
      }
    }

    // Buscar coincidencia muy similar (sin subtítulos)
    const searchBase = normalizedSearch.split(':')[0].trim();
    for (const result of results) {
      const resultBase = result.name.toLowerCase().trim().split(':')[0].trim();
      if (resultBase === searchBase) {
        console.log(`🎯 Coincidencia base: "${result.name}" para "${searchTerm}"`);
        return result;
      }
    }

    // Buscar coincidencia que contenga el término principal
    for (const result of results) {
      const normalizedResult = result.name.toLowerCase().trim();
      if (normalizedResult.includes(searchBase) && result.name.length < searchTerm.length + 20) {
        console.log(`🎯 Coincidencia parcial: "${result.name}" para "${searchTerm}"`);
        return result;
      }
    }

    // Usar el primer resultado como fallback si tiene datos válidos
    const firstValid = results.find(r => r.gameplayMain > 0 || r.gameplayMainExtra > 0);
    if (firstValid) {
      console.log(`⚠️ Usando fallback: "${firstValid.name}" para "${searchTerm}"`);
      return firstValid;
    }

    console.log(`❌ No se encontró coincidencia válida para "${searchTerm}"`);
    return null;
  }

  /**
   * Limpiar nombre del juego para búsqueda más precisa
   */
  private cleanGameName(gameName: string): string {
    return gameName
      .replace(/[™®©]/g, '') // Quitar símbolos de marca
      .replace(/\s*\([^)]*\)/g, '') // Quitar texto entre paréntesis
      .replace(/\s*\[[^\]]*\]/g, '') // Quitar texto entre corchetes
      .replace(/:\s*[^:]*$/g, '') // Quitar subtítulos después de ":"
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/[-–—]/g, ' ') // Reemplazar guiones con espacios
      .trim();
  }

  /**
   * Obtener tiempo estimado basado en género como fallback
   */
  getEstimatedTime(gameName: string): number {
    const name = gameName.toLowerCase();
    
    // Juegos conocidos por ser cortos
    if (name.includes('portal') && !name.includes('portal 2')) return 3;
    if (name.includes('journey')) return 2;
    if (name.includes('limbo')) return 4;
    if (name.includes('inside')) return 4;
    
    // Juegos de plataforma
    if (name.includes('mario') || name.includes('sonic') || name.includes('rayman')) return 8;
    
    // Shooters/FPS campañas
    if (name.includes('call of duty') || name.includes('battlefield') || name.includes('doom')) return 7;
    
    // RPGs
    if (name.includes('witcher') || name.includes('elder scrolls') || name.includes('fallout')) return 45;
    if (name.includes('final fantasy') || name.includes('persona')) return 60;
    
    // Souls-like
    if (name.includes('souls') || name.includes('elden') || name.includes('bloodborne') || name.includes('sekiro')) return 35;
    
    // Estrategia
    if (name.includes('civilization') || name.includes('total war') || name.includes('crusader kings')) return 25;
    
    // Indie/Puzzle
    if (name.includes('indie') || name.includes('puzzle')) return 8;
    
    // Racing/Sports
    if (name.includes('fifa') || name.includes('nba') || name.includes('forza') || name.includes('gran turismo')) return 10;
    
    // Multijugador (sin campaña principal)
    if (name.includes('counter-strike') || name.includes('dota') || name.includes('league of legends') || name.includes('overwatch')) return 0;
    
    return 15; // Valor por defecto
  }
}

export const howLongToBeatService = new HowLongToBeatAPI();
