import { supabase } from './supabaseService';
import { GameMetadataService } from './gameMetadataService';

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
  img_logo_url?: string;
  has_community_visible_stats?: boolean;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
}

interface SteamApiResponse {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

export interface GameData {
  appid: number;
  name: string;
  playtime_forever: number;
  cover_url?: string;
  metacritic_score?: number;
  completion_time?: number;
  positive_reviews?: number;
  negative_reviews?: number;
  stars_rating?: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  gamesImported?: number;
  error?: string;
}

export class SteamService {
  private static readonly API_KEY = import.meta.env.VITE_STEAM_API_KEY;
  // Múltiples proxies CORS como fallback
  private static readonly CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.codetabs.com/v1/proxy?quest='
  ];

  /**
   * Verificar si Steam API está configurada
   */
  static isConfigured(): boolean {
    return Boolean(this.API_KEY && this.API_KEY !== 'your_steam_api_key');
  }

  /**
   * Obtener Steam ID desde URL de perfil
   */
  static extractSteamId(input: string): string | null {
    // Si ya es un Steam ID (solo números)
    if (/^\d{17}$/.test(input)) {
      return input;
    }

    // Extraer de URL de Steam
    const steamUrlMatch = input.match(/steamcommunity\.com\/(?:id|profiles)\/([^/?]+)/);
    if (steamUrlMatch) {
      return steamUrlMatch[1];
    }

    return null;
  }

  /**
   * Obtener biblioteca de juegos de Steam
   */
  static async getUserGames(steamId: string): Promise<SteamGame[]> {
    if (!this.isConfigured()) {
      throw new Error('Steam API Key no configurada');
    }

    // Convertir Steam ID si es una URL
    const resolvedSteamId = await this.resolveSteamId(steamId);
    
    try {
      const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${this.API_KEY}&steamid=${resolvedSteamId}&format=json&include_appinfo=true&include_played_free_games=true`;
      
      console.log('🔧 Obteniendo juegos de Steam para:', steamId);
      console.log('🆔 Steam ID resuelto:', resolvedSteamId);
      
      // Intentar con múltiples proxies CORS
      let lastError: Error | null = null;
      
      for (let i = 0; i < this.CORS_PROXIES.length; i++) {
        const proxy = this.CORS_PROXIES[i];
        try {
          console.log(`🌐 Intentando con proxy ${i + 1}/${this.CORS_PROXIES.length}:`, proxy);
          
          const fullUrl = `${proxy}${encodeURIComponent(url)}`;
          console.log('📡 URL completa:', fullUrl);
          
          const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });
          
          console.log('📊 Respuesta HTTP:', response.status, response.statusText);
          
          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
          }

          const text = await response.text();
          console.log('📄 Primeros 200 caracteres de respuesta:', text.substring(0, 200));
          
          // Verificar si la respuesta es HTML (error del proxy)
          if (text.trim().startsWith('<')) {
            throw new Error('El proxy devolvió HTML en lugar de JSON - posible bloqueo o límite de rate');
          }

          const data: SteamApiResponse = JSON.parse(text);
          console.log('🔍 Datos parseados:', data);
          
          if (!data.response) {
            throw new Error('Respuesta inválida de Steam API - no hay campo "response"');
          }
          
          if (!data.response.games) {
            console.log('⚠️ Sin juegos - Respuesta completa:', data.response);
            throw new Error(`Sin juegos disponibles. Posibles causas:
              • Perfil privado
              • Steam ID inválido 
              • Biblioteca vacía
              • Configuración de privacidad incorrecta`);
          }

          console.log(`✅ ${data.response.game_count} juegos encontrados exitosamente`);
          return data.response.games;

        } catch (error) {
          console.log(`❌ Error con proxy ${i + 1}:`, error);
          lastError = error as Error;
          
          // Si es el último proxy, esperar un poco antes de continuar
          if (i < this.CORS_PROXIES.length - 1) {
            console.log('⏳ Esperando 1 segundo antes del siguiente proxy...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // Si todos los proxies fallaron
      throw new Error(`Todos los proxies CORS fallaron. Último error: ${lastError?.message}`);

    } catch (error) {
      console.error('💥 Error obteniendo juegos de Steam:', error);
      throw error;
    }
  }

  /**
   * Convertir juegos de Steam a formato de la aplicación con datos enriquecidos
   */
  static async processGames(steamGames: SteamGame[]): Promise<GameData[]> {
    const processedGames: GameData[] = [];
    
    // Procesar en lotes para obtener información adicional
    for (let i = 0; i < steamGames.length; i += 10) {
      const batch = steamGames.slice(i, i + 10);
      
      const batchPromises = batch.map(async (game) => {
        // Datos básicos del juego
        const gameData: GameData = {
          appid: game.appid,
          name: game.name,
          playtime_forever: game.playtime_forever,
          cover_url: game.img_icon_url 
            ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
            : undefined,
        };

        // Intentar obtener datos adicionales del juego
        try {
          const gameDetails = await this.getGameDetails(game.appid, game.name);
          if (gameDetails) {
            gameData.metacritic_score = gameDetails.metacritic_score;
            gameData.completion_time = gameDetails.completion_time;
            gameData.positive_reviews = gameDetails.positive_reviews;
            gameData.negative_reviews = gameDetails.negative_reviews;
            // Calcular un rating básico
            gameData.stars_rating = this.calculateBasicStarRating(gameDetails);
          }
        } catch (error) {
          console.log(`No se pudieron obtener detalles para ${game.name}:`, error);
          // No usar datos simulados, dejar en undefined/null para usar solo datos reales
          gameData.positive_reviews = undefined;
          gameData.negative_reviews = undefined;
          gameData.stars_rating = undefined;
        }

        return gameData;
      });

      const batchResults = await Promise.all(batchPromises);
      processedGames.push(...batchResults);

      // Esperar entre lotes para no sobrecargar las APIs
      if (i + 10 < steamGames.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return processedGames;
  }

  /**
   * Obtener detalles adicionales de un juego específico
   */
  private static async getGameDetails(appId: number, gameName?: string): Promise<{
    metacritic_score?: number;
    completion_time?: number;
    positive_reviews?: number;
    negative_reviews?: number;
  } | null> {
    try {
      if (gameName) {
        console.log(`🎮 Obteniendo datos mejorados para: ${gameName} (App ID: ${appId})`);
        
        // Usar el nuevo servicio de metadata que es mucho más confiable
        const gameData = await GameMetadataService.getCompleteGameData(gameName, appId);
        
        console.log(`✅ Datos obtenidos para ${gameName}:`, {
          metacritic: gameData.metacritic_score,
          tiempo: gameData.completion_time
        });

        return {
          metacritic_score: gameData.metacritic_score,
          completion_time: gameData.completion_time,
          positive_reviews: undefined,
          negative_reviews: undefined,
        };
      }

      // Fallback al método anterior si no hay nombre
      const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=metacritic`;
      
      for (const proxy of this.CORS_PROXIES) {
        try {
          const response = await fetch(`${proxy}${encodeURIComponent(url)}`);
          
          if (!response.ok) continue;
          
          const text = await response.text();
          if (text.trim().startsWith('<')) continue;
          
          const data = JSON.parse(text);
          
          if (data[appId] && data[appId].success && data[appId].data) {
            const gameData = data[appId].data;
            
            return {
              metacritic_score: gameData.metacritic?.score || undefined,
              positive_reviews: undefined,
              negative_reviews: undefined,
            };
          }
          
          break;
        } catch (error) {
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo detalles del juego:', error);
      return null;
    }
  }

  /**
   * Calcular rating básico de estrellas
   */
  private static calculateBasicStarRating(gameDetails: {
    metacritic_score?: number;
    completion_time?: number;
    positive_reviews?: number;
    negative_reviews?: number;
  }): number {
    let score = 3; // Base de 3 estrellas
    
    // Ajustar por Metacritic (factor principal)
    if (gameDetails.metacritic_score) {
      if (gameDetails.metacritic_score >= 90) score = 4.8;
      else if (gameDetails.metacritic_score >= 85) score = 4.5;
      else if (gameDetails.metacritic_score >= 80) score = 4.2;
      else if (gameDetails.metacritic_score >= 75) score = 3.8;
      else if (gameDetails.metacritic_score >= 70) score = 3.5;
      else if (gameDetails.metacritic_score >= 65) score = 3.2;
      else if (gameDetails.metacritic_score >= 60) score = 2.8;
      else score = 2.5;
    }
    
    // Pequeño ajuste por duración (juegos muy cortos o muy largos)
    if (gameDetails.completion_time) {
      if (gameDetails.completion_time < 5) score -= 0.2; // Muy corto
      else if (gameDetails.completion_time > 100) score -= 0.1; // Muy largo
      else if (gameDetails.completion_time >= 15 && gameDetails.completion_time <= 50) score += 0.1; // Duración ideal
    }
    
    // Ajustar por reviews
    if (gameDetails.positive_reviews && gameDetails.negative_reviews) {
      const total = gameDetails.positive_reviews + gameDetails.negative_reviews;
      const ratio = gameDetails.positive_reviews / total;
      
      if (ratio >= 0.9) score += 0.2;
      else if (ratio <= 0.6) score -= 0.2;
    }
    
    return Math.max(1, Math.min(5, score));
  }

  /**
   * Sincronizar biblioteca de Steam con la base de datos
   */
  static async syncUserLibrary(userId: string, steamId: string): Promise<SyncResult> {
    try {
      console.log('🔄 Iniciando sincronización de biblioteca...');

      // 1. Obtener juegos de Steam
      const steamGames = await this.getUserGames(steamId);
      
      if (steamGames.length === 0) {
        return {
          success: false,
          message: 'No se encontraron juegos en la biblioteca',
        };
      }

      // 2. Procesar juegos (ahora es async)
      const processedGames = await this.processGames(steamGames);

      // 3. Guardar en la base de datos
      const gamesToInsert = processedGames.map(game => ({
        user_id: userId,
        appid: game.appid,
        name: game.name,
        cover_url: game.cover_url,
        playtime_forever: game.playtime_forever,
        metacritic_score: game.metacritic_score,
        positive_reviews: game.positive_reviews,
        negative_reviews: game.negative_reviews,
        stars_rating: game.stars_rating,
      }));

      // Usar upsert para actualizar juegos existentes
      const { error } = await supabase
        .from('user_games')
        .upsert(gamesToInsert, {
          onConflict: 'user_id,appid',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('❌ Error guardando juegos:', error);
        throw error;
      }

      // 4. Actualizar Steam ID en el perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ steam_id: steamId })
        .eq('id', userId);

      if (profileError) {
        console.warn('⚠️ No se pudo actualizar Steam ID en perfil:', profileError);
      }

      console.log(`🎉 ${processedGames.length} juegos sincronizados exitosamente`);

      return {
        success: true,
        message: `¡${processedGames.length} juegos importados exitosamente!`,
        gamesImported: processedGames.length,
      };

    } catch (error) {
      console.error('💥 Error en sincronización:', error);
      
      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: 'Error al sincronizar biblioteca',
        error: errorMessage,
      };
    }
  }

  /**
   * Verificar si el usuario ya tiene juegos sincronizados
   */
  static async hasGames(userId: string): Promise<boolean> {
    try {
      const { count } = await supabase
        .from('user_games')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error verificando juegos del usuario:', error);
      return false;
    }
  }

  /**
   * Obtener juegos del usuario desde la base de datos
   */
  static async getUserGamesFromDB(userId: string): Promise<GameData[]> {
    try {
      const { data, error } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', userId)
        .order('playtime_forever', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error obteniendo juegos del usuario:', error);
      return [];
    }
  }

  /**
   * Resolver Steam ID desde URL o nombre de usuario
   */
  static async resolveSteamId(input: string): Promise<string> {
    // Si ya es un Steam ID numérico (64-bit), devolverlo tal como está
    if (/^\d{17}$/.test(input)) {
      return input;
    }

    // Extraer nombre de usuario de URL
    let vanityUrl = input;
    
    // Si es una URL completa, extraer el nombre
    if (input.includes('steamcommunity.com/id/')) {
      const match = input.match(/steamcommunity\.com\/id\/([^/]+)/);
      if (match) {
        vanityUrl = match[1];
      }
    } else if (input.includes('steamcommunity.com/profiles/')) {
      // Si es una URL con Steam ID directo
      const match = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
      if (match) {
        return match[1];
      }
    }

    // Resolver vanity URL a Steam ID usando Steam API
    try {
      const url = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${this.API_KEY}&vanityurl=${vanityUrl}`;
      
      // Intentar con los proxies disponibles
      for (const proxy of this.CORS_PROXIES) {
        try {
          const response = await fetch(`${proxy}${encodeURIComponent(url)}`);
          
          if (!response.ok) continue;
          
          const text = await response.text();
          if (text.trim().startsWith('<')) continue;
          
          const data = JSON.parse(text);
          
          if (data.response && data.response.success === 1) {
            return data.response.steamid;
          }
          
        } catch (error) {
          continue;
        }
      }
      
      // Si no se pudo resolver, asumir que es un Steam ID válido
      console.warn('No se pudo resolver Steam ID, usando input original:', input);
      return input;
      
    } catch (error) {
      console.warn('Error resolviendo Steam ID:', error);
      return input;
    }
  }
}
