export interface WishlistGame {
  appid: number;
  name: string;
  capsule: string;
  review_score: number;
  review_desc: string;
  reviews_total: string;
  reviews_percent: number;
  release_date: string;
  release_string: string;
  platform_icons: string;
  subs: Array<{
    packageid: number;
    bundleid?: number;
    discount_block: string;
    discount_pct: number;
    price: number;
  }>;
  type: string;
  screenshots: string[];
  review_css: string;
  priority: number;
  added: number;
  background: string;
  rank: number;
  tags: string[];
  is_free_game: boolean;
  deck_compat?: string;
}

export interface WishlistData {
  games: WishlistGame[];
  totalGames: number;
  success: boolean;
}

class SteamWishlistAPI {
  private readonly baseUrl = 'https://store.steampowered.com/wishlist';
  private readonly corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy/?quest='
  ];

  /**
   * Obtener wishlist de un usuario de Steam
   */
  async getUserWishlist(steamId64: string, language: string = 'es'): Promise<WishlistData> {
    try {
      console.log(`💝 Obteniendo wishlist para Steam ID: ${steamId64}`);
      
      const url = `${this.baseUrl}/profiles/${steamId64}/wishlistdata/?l=${language}`;
      
      for (const proxy of this.corsProxies) {
        try {
          const response = await this.fetchWithProxy(url, proxy);
          if (response) {
            const wishlistData = this.parseWishlistData(response);
            console.log(`✅ Wishlist obtenida: ${wishlistData.games.length} juegos`);
            return wishlistData;
          }
        } catch (error) {
          console.log(`⚠️ Error con proxy ${proxy.substring(0, 30)}:`, error);
          continue;
        }
      }
      
      console.log(`❌ No se pudo obtener la wishlist para Steam ID ${steamId64}`);
      return { games: [], totalGames: 0, success: false };
      
    } catch (error) {
      console.error(`❌ Error obteniendo wishlist para Steam ID ${steamId64}:`, error);
      return { games: [], totalGames: 0, success: false };
    }
  }

  /**
   * Obtener wishlist con filtros
   */
  async getFilteredWishlist(
    steamId64: string, 
    options: {
      language?: string;
      sortBy?: 'priority' | 'added' | 'price' | 'name';
      maxGames?: number;
    } = {}
  ): Promise<WishlistData> {
    const { language = 'es', sortBy = 'priority', maxGames } = options;
    
    try {
      const wishlistData = await this.getUserWishlist(steamId64, language);
      
      if (!wishlistData.success || wishlistData.games.length === 0) {
        return wishlistData;
      }

      // Aplicar ordenamiento
      let sortedGames = [...wishlistData.games];
      
      switch (sortBy) {
        case 'priority':
          sortedGames.sort((a, b) => a.priority - b.priority);
          break;
        case 'added':
          sortedGames.sort((a, b) => b.added - a.added); // Más recientes primero
          break;
        case 'price':
          sortedGames.sort((a, b) => {
            const priceA = a.subs[0]?.price || 0;
            const priceB = b.subs[0]?.price || 0;
            return priceA - priceB; // Menor precio primero
          });
          break;
        case 'name':
          sortedGames.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }

      // Limitar número de juegos si se especifica
      if (maxGames && maxGames > 0) {
        sortedGames = sortedGames.slice(0, maxGames);
      }

      return {
        games: sortedGames,
        totalGames: sortedGames.length,
        success: true
      };
      
    } catch (error) {
      console.error(`❌ Error obteniendo wishlist filtrada:`, error);
      return { games: [], totalGames: 0, success: false };
    }
  }

  /**
   * Realizar fetch con proxy específico
   */
  private async fetchWithProxy(url: string, proxy: string): Promise<Record<string, WishlistGame> | null> {
    const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      
      // Verificar que sea JSON válido
      if (text.trim().startsWith('<') || text.trim() === '' || text.includes('Access Denied')) {
        throw new Error('Invalid response or access denied');
      }
      
      const data = JSON.parse(text);
      
      // Verificar que tenga la estructura esperada
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid wishlist data structure');
      }
      
      return data as Record<string, WishlistGame>;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Parsear datos de wishlist de la respuesta de la API
   */
  private parseWishlistData(data: Record<string, WishlistGame>): WishlistData {
    try {
      const games: WishlistGame[] = [];
      
      for (const [appIdStr, gameData] of Object.entries(data)) {
        const appId = parseInt(appIdStr);
        
        if (isNaN(appId) || !gameData.name) {
          continue; // Saltar entradas inválidas
        }

        // Asegurar que el appid esté presente
        const game: WishlistGame = {
          ...gameData,
          appid: appId,
          // Valores por defecto si faltan
          priority: gameData.priority || 0,
          added: gameData.added || Date.now(),
          rank: gameData.rank || 0,
          reviews_percent: gameData.reviews_percent || 0,
          subs: gameData.subs || [],
          tags: gameData.tags || [],
          screenshots: gameData.screenshots || [],
          is_free_game: gameData.is_free_game || false
        };

        games.push(game);
      }

      return {
        games,
        totalGames: games.length,
        success: true
      };
      
    } catch (error) {
      console.error('Error parsing wishlist data:', error);
      return {
        games: [],
        totalGames: 0,
        success: false
      };
    }
  }

  /**
   * Obtener estadísticas de la wishlist
   */
  getWishlistStats(wishlistData: WishlistData): {
    totalGames: number;
    totalValue: number;
    averagePrice: number;
    freeGames: number;
    discountedGames: number;
    averageReviewScore: number;
  } {
    if (!wishlistData.success || wishlistData.games.length === 0) {
      return {
        totalGames: 0,
        totalValue: 0,
        averagePrice: 0,
        freeGames: 0,
        discountedGames: 0,
        averageReviewScore: 0
      };
    }

    const games = wishlistData.games;
    let totalValue = 0;
    let freeGames = 0;
    let discountedGames = 0;
    let totalReviewScore = 0;
    let gamesWithReviews = 0;

    for (const game of games) {
      // Calcular precio
      if (game.is_free_game) {
        freeGames++;
      } else if (game.subs && game.subs.length > 0) {
        const price = game.subs[0].price || 0;
        totalValue += price;
        
        if (game.subs[0].discount_pct > 0) {
          discountedGames++;
        }
      }

      // Calcular review score promedio
      if (game.reviews_percent > 0) {
        totalReviewScore += game.reviews_percent;
        gamesWithReviews++;
      }
    }

    const paidGames = games.length - freeGames;
    const averagePrice = paidGames > 0 ? totalValue / paidGames : 0;
    const averageReviewScore = gamesWithReviews > 0 ? totalReviewScore / gamesWithReviews : 0;

    return {
      totalGames: games.length,
      totalValue: totalValue / 100, // Convertir centavos a dólares/euros
      averagePrice: averagePrice / 100,
      freeGames,
      discountedGames,
      averageReviewScore: Math.round(averageReviewScore)
    };
  }

  /**
   * Verificar si un juego está en la wishlist
   */
  isGameInWishlist(wishlistData: WishlistData, appId: number): boolean {
    return wishlistData.games.some(game => game.appid === appId);
  }

  /**
   * Obtener juegos de la wishlist por rango de precios
   */
  getGamesByPriceRange(
    wishlistData: WishlistData, 
    minPrice: number = 0, 
    maxPrice: number = Infinity
  ): WishlistGame[] {
    return wishlistData.games.filter(game => {
      if (game.is_free_game && minPrice === 0) return true;
      
      if (game.subs && game.subs.length > 0) {
        const price = (game.subs[0].price || 0) / 100; // Convertir a dólares/euros
        return price >= minPrice && price <= maxPrice;
      }
      
      return false;
    });
  }
}

export const steamWishlistService = new SteamWishlistAPI();
