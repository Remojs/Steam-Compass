import * as cheerio from 'cheerio';

export interface MetacriticScores {
  metascore: number | null;
  userScore: number | null;
  platform: string;
  url?: string;
}

class MetacriticAPI {
  private readonly baseUrl = 'https://www.metacritic.com';
  private readonly corsProxy = 'https://api.allorigins.win/raw?url=';

  /**
   * Obtener scores de Metacritic para un juego
   */
  async getGameScores(gameName: string, platform: string = 'pc'): Promise<MetacriticScores> {
    try {
      console.log(`🎯 Buscando scores de Metacritic para: ${gameName} (${platform})`);
      
      const slug = this.createSlug(gameName);
      const url = `${this.baseUrl}/game/${platform}/${slug}`;
      
      console.log(`🔗 URL generada: ${url}`);
      
      // Intentar obtener la página
      const html = await this.fetchPage(url);
      if (!html) {
        console.log(`⚠️ No se pudo obtener la página para ${gameName}`);
        return this.getEmptyResult(platform);
      }

      const scores = this.parseScores(html, url);
      
      if (scores.metascore || scores.userScore) {
        console.log(`✅ Scores encontrados para ${gameName}:`, scores);
      } else {
        console.log(`⚠️ No se encontraron scores para ${gameName}`);
      }
      
      return scores;
      
    } catch (error) {
      console.error(`❌ Error obteniendo scores de Metacritic para ${gameName}:`, error);
      return this.getEmptyResult(platform);
    }
  }

  /**
   * Buscar el juego en Metacritic (para casos donde el slug directo no funciona)
   */
  async searchGame(gameName: string, platform: string = 'pc'): Promise<MetacriticScores> {
    try {
      console.log(`🔍 Buscando ${gameName} en Metacritic...`);
      
      // Primero intentar con URL directa
      const directResult = await this.getGameScores(gameName, platform);
      if (directResult.metascore || directResult.userScore) {
        return directResult;
      }

      // Si no funciona, intentar variaciones del nombre
      const variations = this.generateNameVariations(gameName);
      
      for (const variation of variations) {
        const result = await this.getGameScores(variation, platform);
        if (result.metascore || result.userScore) {
          return result;
        }
        
        // Esperar un poco entre intentos
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return this.getEmptyResult(platform);
      
    } catch (error) {
      console.error(`❌ Error en búsqueda de Metacritic para ${gameName}:`, error);
      return this.getEmptyResult(platform);
    }
  }

  /**
   * Obtener la página usando proxy CORS
   */
  private async fetchPage(url: string): Promise<string | null> {
    try {
      const proxyUrl = `${this.corsProxy}${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Verificar que no sea una página de error
      if (html.includes('Page Not Found') || html.includes('404') || html.includes('error')) {
        return null;
      }

      return html;
      
    } catch (error) {
      console.log(`Error fetching page ${url}:`, error);
      return null;
    }
  }

  /**
   * Parsear scores de la página HTML
   */
  private parseScores(html: string, url: string): MetacriticScores {
    const $ = cheerio.load(html);
    
    let metascore: number | null = null;
    let userScore: number | null = null;

    // Buscar Metascore con selectores actualizados de 2024/2025
    const metascoreSelectors = [
      '.c-siteReviewScore_background-critic_medium .c-siteReviewScore_medium',
      '.c-productScoreInfo_scoreNumber.u-float-right',
      '.metascore_w.large.game.positive',
      '.metascore_w.large.game.mixed', 
      '.metascore_w.large.game.negative',
      '[data-testid="meta-score"]',
      '.c-siteReviewScore_background-critic .c-siteReviewScore_medium',
      'div[class*="metascore"] span',
      'span[class*="metascore"]'
    ];

    for (const selector of metascoreSelectors) {
      try {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
          const scoreText = $(elements[i]).text().trim();
          console.log(`🔍 Metacritic selector "${selector}": "${scoreText}"`);
          
          if (scoreText && !isNaN(parseInt(scoreText)) && parseInt(scoreText) >= 0 && parseInt(scoreText) <= 100) {
            metascore = parseInt(scoreText);
            console.log(`✅ Metascore encontrado: ${metascore} con selector: ${selector}`);
            break;
          }
        }
        if (metascore) break;
      } catch (e) {
        continue;
      }
    }

    // Buscar User Score con selectores actualizados
    const userScoreSelectors = [
      '.c-siteReviewScore_background-user .c-siteReviewScore_medium',
      '.c-productScoreInfo_scoreNumber.c-productScoreInfo_scoreNumber--user',
      '.metascore_w.user.large.game',
      '[data-testid="user-score"]',
      'div[class*="userscore"] span',
      'span[class*="userscore"]'
    ];

    for (const selector of userScoreSelectors) {
      try {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
          const scoreText = $(elements[i]).text().trim();
          console.log(`🔍 User Score selector "${selector}": "${scoreText}"`);
          
          if (scoreText && scoreText !== 'tbd' && !isNaN(parseFloat(scoreText))) {
            const score = parseFloat(scoreText);
            userScore = score <= 10 ? Math.round(score * 10) : Math.round(score);
            console.log(`✅ User Score encontrado: ${userScore} con selector: ${selector}`);
            break;
          }
        }
        if (userScore) break;
      } catch (e) {
        continue;
      }
    }

    console.log(`📊 Resultados para ${url}: Metascore=${metascore}, UserScore=${userScore}`);

    return {
      metascore,
      userScore,
      platform: 'pc',
      url: metascore || userScore ? url : undefined
    };
  }

  /**
   * Crear slug de URL a partir del nombre del juego
   */
  private createSlug(gameName: string): string {
    const slug = gameName
      .toLowerCase()
      .replace(/[™®©]/g, '') // Quitar símbolos de marca
      .replace(/\s*\([^)]*\)/g, '') // Quitar texto entre paréntesis
      .replace(/\s*\[[^\]]*\]/g, '') // Quitar texto entre corchetes
      .replace(/[:]/g, '') // Quitar dos puntos
      .replace(/[^\w\s-]/g, '') // Quitar caracteres especiales excepto guiones
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno solo
      .replace(/^-|-$/g, ''); // Quitar guiones del inicio y final

    console.log(`🔗 Slug creado: "${gameName}" -> "${slug}"`);
    return slug;
  }

  /**
   * Generar variaciones del nombre para intentar diferentes búsquedas
   */
  private generateNameVariations(gameName: string): string[] {
    const variations: string[] = [];
    
    // Nombre original limpio
    const cleanName = gameName.replace(/[™®©]/g, '').trim();
    variations.push(cleanName);
    
    // Sin subtítulos (texto después de ':')
    if (cleanName.includes(':')) {
      variations.push(cleanName.split(':')[0].trim());
    }
    
    // Sin texto entre paréntesis
    const withoutParens = cleanName.replace(/\s*\([^)]*\)/g, '').trim();
    if (withoutParens !== cleanName) {
      variations.push(withoutParens);
    }
    
    // Reemplazar números romanos
    const romanNumerals: Record<string, string> = {
      ' II': ' 2',
      ' III': ' 3',
      ' IV': ' 4',
      ' V': ' 5',
      ' VI': ' 6',
      ' VII': ' 7',
      ' VIII': ' 8',
      ' IX': ' 9',
      ' X': ' 10'
    };
    
    let withNumbers = cleanName;
    for (const [roman, number] of Object.entries(romanNumerals)) {
      if (withNumbers.includes(roman)) {
        withNumbers = withNumbers.replace(roman, number);
        variations.push(withNumbers);
        break;
      }
    }
    
    // Remover duplicados
    return [...new Set(variations)];
  }

  /**
   * Resultado vacío por defecto
   */
  private getEmptyResult(platform: string): MetacriticScores {
    return {
      metascore: null,
      userScore: null,
      platform
    };
  }

  /**
   * Obtener score estimado basado en el nombre del juego (fallback)
   */
  getEstimatedScore(gameName: string): number {
    const name = gameName.toLowerCase();
    
    // Juegos con scores conocidos altos
    if (name.includes('elden ring')) return 96;
    if (name.includes('witcher 3')) return 93;
    if (name.includes('god of war') && !name.includes('ascension')) return 94;
    if (name.includes('red dead redemption 2')) return 97;
    if (name.includes('grand theft auto v')) return 96;
    if (name.includes('bloodborne')) return 92;
    if (name.includes('sekiro')) return 90;
    if (name.includes('dark souls iii')) return 89;
    if (name.includes('horizon zero dawn')) return 89;
    if (name.includes('persona 5')) return 95;
    
    // Juegos indie bien valorados
    if (name.includes('hollow knight')) return 90;
    if (name.includes('celeste')) return 94;
    if (name.includes('hades')) return 93;
    if (name.includes('disco elysium')) return 97;
    
    // Juegos multijugador populares
    if (name.includes('overwatch')) return 90;
    if (name.includes('counter-strike')) return 83;
    if (name.includes('dota 2')) return 90;
    
    // Valores por género
    if (name.includes('call of duty') || name.includes('battlefield')) return 81;
    if (name.includes('fifa') || name.includes('nba')) return 78;
    if (name.includes('assassin')) return 75;
    
    return 75; // Score neutral por defecto
  }
}

export const metacriticService = new MetacriticAPI();
