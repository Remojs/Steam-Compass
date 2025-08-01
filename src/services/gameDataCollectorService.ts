import { howLongToBeatService, CompletionTimes } from './howLongToBeatService';
import { metacriticService, MetacriticScores } from './metacriticService';
import { steamReviewsService, SteamReviews } from './steamReviewsService';
import { steamWishlistService, WishlistData } from './steamWishlistService';

export interface CompleteGameData {
  // Datos básicos
  appid: number;
  name: string;
  playtime_forever: number;
  cover_url?: string;
  
  // Scores y reviews
  metacritic_score?: number;
  metacritic_user_score?: number;
  steam_reviews?: SteamReviews;
  review_percentage?: number;
  
  // Tiempos de completación
  completion_times?: CompletionTimes;
  estimated_completion_time?: number;
  main_story_hours?: number;
  main_plus_extra_hours?: number;
  completionist_hours?: number;
  
  // Datos calculados
  stars_rating?: number;
  quality_score?: number;
  value_rating?: number;
  
  // Estado
  is_in_wishlist?: boolean;
  last_updated?: string;
}

export interface GameDataCollectionResult {
  success: boolean;
  total_processed: number;
  successful_fetches: number;
  failed_fetches: number;
  games: CompleteGameData[];
  errors: string[];
}

class GameDataCollectorService {
  /**
   * Recopilar datos completos para un solo juego
   */
  async collectGameData(
    appId: number, 
    gameName: string, 
    playtimeForever: number = 0,
    options: {
      includeReviews?: boolean;
      includeMetacritic?: boolean;
      includeCompletionTimes?: boolean;
      checkWishlist?: boolean;
      steamId64?: string;
    } = {}
  ): Promise<CompleteGameData> {
    const {
      includeReviews = true,
      includeMetacritic = true,
      includeCompletionTimes = true,
      checkWishlist = false,
      steamId64
    } = options;

    console.log(`🎮 Recopilando datos completos para: ${gameName} (${appId})`);

    const gameData: CompleteGameData = {
      appid: appId,
      name: gameName,
      playtime_forever: playtimeForever,
      cover_url: `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`,
      last_updated: new Date().toISOString()
    };

    // Recopilar datos en paralelo para mejor rendimiento
    const dataPromises: Promise<void>[] = [];

    // Metacritic scores
    if (includeMetacritic) {
      dataPromises.push(
        metacriticService.searchGame(gameName).then(scores => {
          if (scores.metascore) {
            gameData.metacritic_score = scores.metascore;
            console.log(`✅ Metacritic para ${gameName}: ${scores.metascore}`);
          } else {
            console.log(`⚠️ No se encontró Metacritic para ${gameName}`);
          }
          
          if (scores.userScore) {
            gameData.metacritic_user_score = scores.userScore;
            console.log(`✅ User Score para ${gameName}: ${scores.userScore}`);
          }
        }).catch(error => {
          console.log(`⚠️ Error obteniendo Metacritic para ${gameName}:`, error.message);
        })
      );
    }

    // Steam reviews
    if (includeReviews) {
      dataPromises.push(
        steamReviewsService.getGameReviews(appId).then(reviews => {
          if (reviews?.review_score !== undefined) {
            gameData.steam_reviews = reviews;
            gameData.review_percentage = reviews.review_score;
            console.log(`✅ Steam Reviews para ${gameName}: ${reviews.review_score}% positive`);
          } else {
            console.log(`⚠️ No se encontraron reviews para ${gameName}`);
          }
        }).catch(error => {
          console.log(`⚠️ Error obteniendo reviews para ${gameName}:`, error.message);
        })
      );
    }

    // Completion times
    if (includeCompletionTimes) {
      dataPromises.push(
        howLongToBeatService.getCompletionTimes(gameName).then(times => {
          gameData.completion_times = times;
          
          // Extraer tiempos individuales
          if (times.main) {
            gameData.main_story_hours = times.main;
            console.log(`✅ HowLongToBeat para ${gameName}: ${times.main}h (Main Story)`);
          } else {
            console.log(`⚠️ No se encontró tiempo Main Story para ${gameName}`);
          }
          
          if (times.completionist) {
            gameData.completionist_hours = times.completionist;
            console.log(`✅ Completionist para ${gameName}: ${times.completionist}h`);
          }
          
          if (times.mainExtra) {
            gameData.main_plus_extra_hours = times.mainExtra;
            console.log(`✅ Main + Extra para ${gameName}: ${times.mainExtra}h`);
          }
          
          // Usar el tiempo promedio calculado como estimado
          gameData.estimated_completion_time = times.average || 
            howLongToBeatService.getEstimatedTime(gameName);
            
        }).catch(error => {
          console.log(`⚠️ Error obteniendo HowLongToBeat para ${gameName}:`, error.message);
        })
      );
    }

    // Ejecutar todas las promesas
    await Promise.allSettled(dataPromises);

    // Calcular datos derivados
    this.calculateDerivedData(gameData);

    // Verificar wishlist si se solicita
    if (checkWishlist && steamId64) {
      try {
        const wishlistData = await steamWishlistService.getUserWishlist(steamId64);
        gameData.is_in_wishlist = steamWishlistService.isGameInWishlist(wishlistData, appId);
      } catch (error) {
        console.log(`⚠️ Error verificando wishlist para ${gameName}:`, error);
      }
    }

    console.log(`✅ Datos recopilados para ${gameName}:`, {
      metacritic: gameData.metacritic_score,
      reviews: gameData.review_percentage,
      completion: gameData.estimated_completion_time,
      stars: gameData.stars_rating
    });

    return gameData;
  }

  /**
   * Recopilar datos para múltiples juegos en lotes
   */
  async collectMultipleGamesData(
    games: Array<{ appid: number; name: string; playtime_forever?: number }>,
    options: {
      batchSize?: number;
      delayBetweenBatches?: number;
      includeReviews?: boolean;
      includeMetacritic?: boolean;
      includeCompletionTimes?: boolean;
      checkWishlist?: boolean;
      steamId64?: string;
    } = {}
  ): Promise<GameDataCollectionResult> {
    const {
      batchSize = 5,
      delayBetweenBatches = 2000,
      ...collectionOptions
    } = options;

    console.log(`📊 Iniciando recopilación de datos para ${games.length} juegos`);

    const result: GameDataCollectionResult = {
      success: false,
      total_processed: games.length,
      successful_fetches: 0,
      failed_fetches: 0,
      games: [],
      errors: []
    };

    // Procesar en lotes
    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);
      
      console.log(`🔄 Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(games.length / batchSize)}`);

      const batchPromises = batch.map(async (game) => {
        try {
          const gameData = await this.collectGameData(
            game.appid,
            game.name,
            game.playtime_forever || 0,
            collectionOptions
          );
          result.games.push(gameData);
          result.successful_fetches++;
        } catch (error) {
          const errorMessage = `Error procesando ${game.name}: ${error}`;
          result.errors.push(errorMessage);
          result.failed_fetches++;
          console.error(`❌ ${errorMessage}`);
        }
      });

      await Promise.allSettled(batchPromises);

      // Pausa entre lotes para no sobrecargar las APIs
      if (i + batchSize < games.length) {
        console.log(`⏳ Esperando ${delayBetweenBatches}ms antes del siguiente lote...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    result.success = result.successful_fetches > 0;

    console.log(`✅ Recopilación completada: ${result.successful_fetches}/${result.total_processed} exitosos`);

    return result;
  }

  /**
   * Calcular datos derivados (ratings, scores, etc.)
   */
  private calculateDerivedData(gameData: CompleteGameData): void {
    // Calcular rating de estrellas basado en múltiples factores
    gameData.stars_rating = this.calculateStarRating(gameData);
    
    // Calcular score de calidad
    gameData.quality_score = this.calculateQualityScore(gameData);
    
    // Calcular rating de valor (calidad vs tiempo)
    gameData.value_rating = this.calculateValueRating(gameData);
  }

  /**
   * Calcular rating de estrellas (1-5) basado en múltiples factores
   */
  private calculateStarRating(gameData: CompleteGameData): number {
    let score = 3; // Base neutral
    let factors = 0;
    
    // Factor Metacritic (peso: 40%)
    if (gameData.metacritic_score) {
      const metacriticWeight = 0.4;
      if (gameData.metacritic_score >= 90) score += 2 * metacriticWeight;
      else if (gameData.metacritic_score >= 85) score += 1.5 * metacriticWeight;
      else if (gameData.metacritic_score >= 80) score += 1 * metacriticWeight;
      else if (gameData.metacritic_score >= 75) score += 0.5 * metacriticWeight;
      else if (gameData.metacritic_score >= 70) score += 0 * metacriticWeight;
      else if (gameData.metacritic_score >= 65) score -= 0.5 * metacriticWeight;
      else if (gameData.metacritic_score >= 60) score -= 1 * metacriticWeight;
      else score -= 1.5 * metacriticWeight;
      factors++;
    }

    // Factor Steam Reviews (peso: 35%)
    if (gameData.review_percentage !== undefined) {
      const reviewWeight = 0.35;
      if (gameData.review_percentage >= 95) score += 2 * reviewWeight;
      else if (gameData.review_percentage >= 90) score += 1.5 * reviewWeight;
      else if (gameData.review_percentage >= 80) score += 1 * reviewWeight;
      else if (gameData.review_percentage >= 70) score += 0.5 * reviewWeight;
      else if (gameData.review_percentage >= 60) score += 0 * reviewWeight;
      else if (gameData.review_percentage >= 50) score -= 0.5 * reviewWeight;
      else if (gameData.review_percentage >= 40) score -= 1 * reviewWeight;
      else score -= 1.5 * reviewWeight;
      factors++;
    }

    // Factor User Score de Metacritic (peso: 15%)
    if (gameData.metacritic_user_score) {
      const userWeight = 0.15;
      if (gameData.metacritic_user_score >= 85) score += 1 * userWeight;
      else if (gameData.metacritic_user_score >= 75) score += 0.5 * userWeight;
      else if (gameData.metacritic_user_score >= 65) score += 0 * userWeight;
      else if (gameData.metacritic_user_score >= 55) score -= 0.5 * userWeight;
      else score -= 1 * userWeight;
      factors++;
    }

    // Ajuste por duración (peso: 10%)
    const hours = gameData.main_story_hours || gameData.estimated_completion_time;
    if (hours) {
      const durationWeight = 0.1;
      if (hours < 3) score -= 0.5 * durationWeight; // Muy corto
      else if (hours > 80) score -= 0.3 * durationWeight; // Muy largo
      else if (hours >= 15 && hours <= 50) {
        score += 0.3 * durationWeight; // Duración ideal
      }
    }

    // Si no hay datos suficientes, usar score estimado
    if (factors === 0) {
      score = this.getEstimatedRating(gameData.name);
    }

    return Math.max(1, Math.min(5, score));
  }

  /**
   * Calcular score de calidad general (0-100)
   */
  private calculateQualityScore(gameData: CompleteGameData): number {
    let score = 50; // Base neutral
    let totalWeight = 0;

    // Metacritic (peso 50%)
    if (gameData.metacritic_score) {
      score += (gameData.metacritic_score - 50) * 0.5;
      totalWeight += 0.5;
    }

    // Steam Reviews (peso 30%)
    if (gameData.review_percentage !== undefined) {
      score += (gameData.review_percentage - 50) * 0.3;
      totalWeight += 0.3;
    }

    // User Score (peso 20%)
    if (gameData.metacritic_user_score) {
      score += (gameData.metacritic_user_score - 50) * 0.2;
      totalWeight += 0.2;
    }

    // Normalizar si no todos los factores están presentes
    if (totalWeight < 1 && totalWeight > 0) {
      score = 50 + (score - 50) / totalWeight;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calcular rating de valor (calidad por hora)
   */
  private calculateValueRating(gameData: CompleteGameData): number {
    if (!gameData.quality_score) {
      return 0;
    }

    // Usar main_story_hours como preferencia, luego estimated_completion_time
    const hours = gameData.main_story_hours || gameData.estimated_completion_time;
    
    if (!hours || hours === 0) {
      return 0;
    }

    const qualityScore = gameData.quality_score;

    // Calcular valor base (calidad / tiempo)
    let value = qualityScore / hours;

    // Ajustar por duración óptima (15-40 horas es ideal)
    if (hours >= 15 && hours <= 40) {
      value *= 1.2; // Bonus por duración ideal
    } else if (hours < 5) {
      value *= 0.7; // Penalización por muy corto
    } else if (hours > 80) {
      value *= 0.8; // Penalización por muy largo
    }

    // Normalizar a escala 0-10
    return Math.max(0, Math.min(10, value));
  }

  /**
   * Obtener rating estimado basado en el nombre del juego
   */
  private getEstimatedRating(gameName: string): number {
    const name = gameName.toLowerCase();
    
    // Juegos altamente valorados
    if (name.includes('elden ring') || name.includes('witcher 3') || name.includes('red dead redemption 2')) return 4.8;
    if (name.includes('god of war') || name.includes('bloodborne') || name.includes('sekiro')) return 4.5;
    if (name.includes('horizon') || name.includes('dark souls') || name.includes('persona 5')) return 4.3;
    
    // Juegos populares pero no perfectos
    if (name.includes('cyberpunk') || name.includes('assassin') || name.includes('call of duty')) return 3.5;
    
    // Juegos indie bien valorados
    if (name.includes('hollow knight') || name.includes('celeste') || name.includes('hades')) return 4.4;
    
    // Juegos multijugador
    if (name.includes('counter-strike') || name.includes('dota') || name.includes('overwatch')) return 4.0;
    
    return 3.0; // Neutral por defecto
  }

  /**
   * Obtener resumen de estadísticas de una colección de juegos
   */
  getCollectionStats(games: CompleteGameData[]): {
    totalGames: number;
    averageRating: number;
    averageQuality: number;
    totalPlaytime: number;
    averageCompletionTime: number;
    topRatedGames: CompleteGameData[];
    gamesWithMetacritic: number;
    gamesWithReviews: number;
  } {
    if (games.length === 0) {
      return {
        totalGames: 0,
        averageRating: 0,
        averageQuality: 0,
        totalPlaytime: 0,
        averageCompletionTime: 0,
        topRatedGames: [],
        gamesWithMetacritic: 0,
        gamesWithReviews: 0
      };
    }

    const totalPlaytime = games.reduce((sum, game) => sum + game.playtime_forever, 0);
    const ratingsSum = games.reduce((sum, game) => sum + (game.stars_rating || 0), 0);
    const qualitySum = games.reduce((sum, game) => sum + (game.quality_score || 0), 0);
    const completionTimeSum = games.reduce((sum, game) => sum + (game.estimated_completion_time || 0), 0);
    
    const gamesWithMetacritic = games.filter(game => game.metacritic_score).length;
    const gamesWithReviews = games.filter(game => game.review_percentage !== undefined).length;
    
    const topRatedGames = games
      .filter(game => game.stars_rating && game.stars_rating >= 4)
      .sort((a, b) => (b.stars_rating || 0) - (a.stars_rating || 0))
      .slice(0, 10);

    return {
      totalGames: games.length,
      averageRating: ratingsSum / games.length,
      averageQuality: qualitySum / games.length,
      totalPlaytime: Math.round(totalPlaytime / 60), // Convertir a horas
      averageCompletionTime: Math.round(completionTimeSum / games.length),
      topRatedGames,
      gamesWithMetacritic,
      gamesWithReviews
    };
  }
}

export const gameDataCollectorService = new GameDataCollectorService();
