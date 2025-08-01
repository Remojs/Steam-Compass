import { supabase } from './supabaseService';
import { gameDataCollectorService, CompleteGameData } from './gameDataCollectorService';

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
  metacritic_user_score?: number;
  completion_time?: number;
  main_story_hours?: number;
  main_plus_extra_hours?: number;
  completionist_hours?: number;
  estimated_completion_time?: number;
  review_percentage?: number;
  stars_rating?: number;
  quality_score?: number;
  value_rating?: number;
  last_updated?: string;
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
  /**
   * Procesar juegos de Steam y obtener datos completos
   */
  static async processGames(steamGames: SteamGame[]): Promise<CompleteGameData[]> {
    console.log(`🎮 Procesando ${steamGames.length} juegos de Steam...`);
    
    // Convertir formato de SteamGame a formato requerido por el collector
    const gamesToProcess = steamGames.map(game => ({
      appid: game.appid,
      name: game.name,
      playtime_forever: game.playtime_forever
    }));

    // Usar el nuevo servicio de recopilación de datos
    const result = await gameDataCollectorService.collectMultipleGamesData(
      gamesToProcess,
      {
        batchSize: 3, // Lotes más pequeños para evitar rate limits
        delayBetweenBatches: 3000, // 3 segundos entre lotes
        includeReviews: true,
        includeMetacritic: true,
        includeCompletionTimes: true,
        checkWishlist: false // No verificar wishlist por ahora
      }
    );

    if (result.success) {
      console.log(`✅ Procesamiento completado: ${result.successful_fetches}/${result.total_processed} juegos`);
      
      // Agregar URLs de cover si no están presentes
      result.games.forEach(game => {
        if (!game.cover_url) {
          game.cover_url = `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/header.jpg`;
        }
      });
    } else {
      console.error(`❌ Error en el procesamiento de juegos`);
    }

    return result.games;
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
        completion_time: game.estimated_completion_time,
        review_percentage: game.review_percentage,
        stars_rating: game.stars_rating,
        quality_score: game.quality_score,
        last_updated: game.last_updated
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
