interface SteamReviewsResponse {
  query_summary: {
    num_reviews: number;
    review_score: number;
    review_score_desc: string;
    total_positive: number;
    total_negative: number;
    total_reviews: number;
  };
  reviews?: Array<unknown>;
  cursor?: string;
  success: number;
}

export interface SteamReviews {
  total_positive: number;
  total_negative: number;
  total_reviews: number;
  review_score: number; // 0-100%
  review_score_desc: string;
  query_summary: {
    num_reviews: number;
    review_score: number;
    review_score_desc: string;
    total_positive: number;
    total_negative: number;
    total_reviews: number;
  };
}

class SteamReviewsAPI {
  private readonly baseUrl = 'https://store.steampowered.com/appreviews';
  private readonly corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy/?quest=',
    'https://cors-anywhere.herokuapp.com/'
  ];

  /**
   * Obtener reviews de Steam para un juego
   */
  async getGameReviews(appId: number): Promise<SteamReviews | null> {
    try {
      console.log(`📝 Obteniendo reviews de Steam para App ID: ${appId}`);
      
      const url = `${this.baseUrl}/${appId}?json=1&language=all&day_range=365&cursor=*&review_type=all&purchase_type=all`;
      
      for (const proxy of this.corsProxies) {
        try {
          const response = await this.fetchWithProxy(url, proxy);
          if (response) {
            const reviews = this.parseReviewData(response);
            if (reviews) {
              console.log(`✅ Reviews obtenidas para App ID ${appId}:`, {
                total: reviews.total_reviews,
                score: reviews.review_score,
                desc: reviews.review_score_desc
              });
              return reviews;
            }
          }
        } catch (error) {
          console.log(`⚠️ Error con proxy ${proxy.substring(0, 30)}:`, error);
          continue;
        }
      }
      
      console.log(`❌ No se pudieron obtener reviews para App ID ${appId}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Error obteniendo reviews para App ID ${appId}:`, error);
      return null;
    }
  }

  /**
   * Obtener reviews con información detallada
   */
  async getDetailedReviews(appId: number): Promise<{
    recent: SteamReviews | null;
    overall: SteamReviews | null;
  }> {
    try {
      console.log(`📊 Obteniendo reviews detalladas para App ID: ${appId}`);
      
      // Reviews recientes (últimos 30 días)
      const recentUrl = `${this.baseUrl}/${appId}?json=1&language=all&day_range=30&cursor=*&review_type=all&purchase_type=all`;
      
      // Reviews generales (todo el tiempo)
      const overallUrl = `${this.baseUrl}/${appId}?json=1&language=all&cursor=*&review_type=all&purchase_type=all`;
      
      const [recent, overall] = await Promise.allSettled([
        this.fetchReviewsWithFallback(recentUrl),
        this.fetchReviewsWithFallback(overallUrl)
      ]);

      return {
        recent: recent.status === 'fulfilled' ? recent.value : null,
        overall: overall.status === 'fulfilled' ? overall.value : null
      };
      
    } catch (error) {
      console.error(`❌ Error obteniendo reviews detalladas para App ID ${appId}:`, error);
      return { recent: null, overall: null };
    }
  }

  /**
   * Obtener reviews con fallback a múltiples proxies
   */
  private async fetchReviewsWithFallback(url: string): Promise<SteamReviews | null> {
    for (const proxy of this.corsProxies) {
      try {
        const response = await this.fetchWithProxy(url, proxy);
        if (response) {
          const reviews = this.parseReviewData(response);
          if (reviews) return reviews;
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }

  /**
   * Realizar fetch con proxy específico
   */
  private async fetchWithProxy(url: string, proxy: string): Promise<SteamReviewsResponse | null> {
    const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    try {
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SteamCompass/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      
      // Verificar que sea JSON válido
      if (text.trim().startsWith('<')) {
        throw new Error('HTML response instead of JSON');
      }
      
      return JSON.parse(text);
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Parsear datos de reviews de la respuesta de la API
   */
  private parseReviewData(data: SteamReviewsResponse): SteamReviews | null {
    try {
      if (!data || !data.query_summary) {
        console.log('❌ No hay query_summary en los datos de reviews');
        return null;
      }

      const summary = data.query_summary;
      
      console.log('🔍 Datos de reviews recibidos:', {
        totalPositive: summary.total_positive,
        totalNegative: summary.total_negative,
        totalReviews: summary.total_reviews,
        reviewScore: summary.review_score,
        reviewScoreDesc: summary.review_score_desc
      });

      // Calcular porcentaje de reviews positivas usando los datos reales
      const totalReviews = summary.total_positive + summary.total_negative;
      const reviewScore = totalReviews > 0 
        ? Math.round((summary.total_positive / totalReviews) * 100)
        : summary.review_score || 0;

      const result = {
        total_positive: summary.total_positive || 0,
        total_negative: summary.total_negative || 0,
        total_reviews: summary.total_reviews || totalReviews,
        review_score: reviewScore,
        review_score_desc: summary.review_score_desc || this.getReviewScoreDescription(reviewScore, totalReviews),
        query_summary: {
          num_reviews: summary.num_reviews || 0,
          review_score: reviewScore,
          review_score_desc: summary.review_score_desc || this.getReviewScoreDescription(reviewScore, totalReviews),
          total_positive: summary.total_positive || 0,
          total_negative: summary.total_negative || 0,
          total_reviews: summary.total_reviews || totalReviews
        }
      };

      console.log('✅ Reviews procesadas:', {
        score: result.review_score,
        description: result.review_score_desc,
        total: result.total_reviews
      });

      return result;
      
    } catch (error) {
      console.error('❌ Error parsing review data:', error);
      return null;
    }
  }

  /**
   * Obtener descripción del score de reviews según el porcentaje
   */
  private getReviewScoreDescription(percentage: number, totalReviews: number): string {
    if (totalReviews < 10) return 'No user reviews';
    
    if (percentage >= 95) return 'Overwhelmingly Positive';
    if (percentage >= 80) return 'Very Positive';
    if (percentage >= 70) return 'Mostly Positive';
    if (percentage >= 60) return 'Mixed';
    if (percentage >= 40) return 'Mostly Negative';
    if (percentage >= 20) return 'Very Negative';
    return 'Overwhelmingly Negative';
  }

  /**
   * Obtener estadísticas simples de reviews
   */
  getReviewStats(reviews: SteamReviews): {
    positivePercentage: number;
    negativePercentage: number;
    totalReviews: number;
    isReliable: boolean;
  } {
    const total = reviews.total_reviews;
    const positive = reviews.total_positive;
    const negative = reviews.total_negative;
    
    return {
      positivePercentage: total > 0 ? Math.round((positive / total) * 100) : 0,
      negativePercentage: total > 0 ? Math.round((negative / total) * 100) : 0,
      totalReviews: total,
      isReliable: total >= 50 // Considerar confiable si tiene al menos 50 reviews
    };
  }

  /**
   * Convertir reviews a rating de estrellas (1-5)
   */
  convertToStarRating(reviewScore: number, totalReviews: number): number {
    if (totalReviews < 10) return 3; // Neutral si no hay suficientes reviews
    
    // Convertir porcentaje a estrellas (1-5)
    if (reviewScore >= 95) return 5.0;
    if (reviewScore >= 85) return 4.5;
    if (reviewScore >= 75) return 4.0;
    if (reviewScore >= 65) return 3.5;
    if (reviewScore >= 55) return 3.0;
    if (reviewScore >= 45) return 2.5;
    if (reviewScore >= 35) return 2.0;
    if (reviewScore >= 25) return 1.5;
    return 1.0;
  }
}

export const steamReviewsService = new SteamReviewsAPI();
