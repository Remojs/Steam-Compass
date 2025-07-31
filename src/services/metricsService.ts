/**
 * Game metrics calculation service
 * Calculates various metrics for games including star ratings, percentages, etc.
 */

import { Game, SteamReviewsResponse } from '../lib/types';

class MetricsService {
  /**
   * Calculate star rating based on multiple factors
   * Factors: Metacritic score, Steam reviews, playtime vs estimated time
   */
  calculateStarRating(game: Game): number {
    let totalScore = 0;
    let factorCount = 0;

    // Metacritic score contribution (40% weight)
    if (game.metacritic_score && game.metacritic_score > 0) {
      const metacriticNormalized = game.metacritic_score / 20; // Convert 0-100 to 0-5
      totalScore += metacriticNormalized * 0.4;
      factorCount += 0.4;
    }

    // Steam reviews contribution (40% weight)
    if (game.positive_reviews && game.negative_reviews) {
      const totalReviews = game.positive_reviews + game.negative_reviews;
      const positiveRatio = game.positive_reviews / totalReviews;
      const steamScore = positiveRatio * 5; // Convert ratio to 0-5 scale
      totalScore += steamScore * 0.4;
      factorCount += 0.4;
    }

    // Playtime factor (20% weight)
    // Games with reasonable playtime vs estimated time get bonus
    if (game.hours_to_beat && game.hours_to_beat > 0) {
      const playtimeHours = game.playtime_forever / 60;
      const playtimeRatio = Math.min(playtimeHours / game.hours_to_beat, 2); // Cap at 2x
      const playtimeScore = Math.min(playtimeRatio * 2.5, 5); // Convert to 0-5 scale
      totalScore += playtimeScore * 0.2;
      factorCount += 0.2;
    }

    // If we don't have enough factors, apply defaults
    if (factorCount < 0.8) {
      // Use a baseline score of 3.5 for missing data
      const missingWeight = 1 - factorCount;
      totalScore += 3.5 * missingWeight;
      factorCount = 1;
    }

    const finalScore = totalScore / factorCount;
    return Math.round(finalScore * 2) / 2; // Round to nearest 0.5
  }

  /**
   * Calculate positive review percentage
   */
  calculatePositivePercentage(positiveReviews: number, negativeReviews: number): number {
    if (positiveReviews === 0 && negativeReviews === 0) {
      return 0;
    }

    const total = positiveReviews + negativeReviews;
    return Math.round((positiveReviews / total) * 100);
  }

  /**
   * Process Steam reviews data to extract metrics
   */
  processReviewsData(reviewsData: SteamReviewsResponse): { positive: number; negative: number; percentage: number } {
    const { total_positive, total_negative } = reviewsData.query_summary;
    
    return {
      positive: total_positive,
      negative: total_negative,
      percentage: this.calculatePositivePercentage(total_positive, total_negative)
    };
  }

  /**
   * Determine game priority based on metrics
   * Higher priority = should play sooner
   */
  calculateGamePriority(game: Game): number {
    let priority = 0;

    // High rated games get higher priority
    if (game.stars_rating) {
      priority += game.stars_rating * 20; // 0-100 points
    }

    // Shorter games get slight priority boost (easier to complete)
    if (game.hours_to_beat) {
      if (game.hours_to_beat <= 10) {
        priority += 15; // Short games bonus
      } else if (game.hours_to_beat <= 30) {
        priority += 10; // Medium games bonus
      } else {
        priority += 5; // Long games small bonus
      }
    }

    // Unplayed games get priority
    if (game.playtime_forever === 0) {
      priority += 25; // New games bonus
    }

    // Partially played games get completion bonus
    if (game.playtime_forever > 0 && game.hours_to_beat) {
      const completionRatio = (game.playtime_forever / 60) / game.hours_to_beat;
      if (completionRatio > 0.1 && completionRatio < 0.8) {
        priority += 20; // Nearly finished games bonus
      }
    }

    return Math.min(priority, 100); // Cap at 100
  }

  /**
   * Generate game recommendations based on user's library
   */
  generateRecommendations(games: Game[], limit: number = 5): Game[] {
    const gamesWithPriority = games.map(game => ({
      ...game,
      priority: this.calculateGamePriority(game)
    }));

    return gamesWithPriority
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  /**
   * Calculate library statistics
   */
  calculateLibraryStats(games: Game[]) {
    const totalGames = games.length;
    const totalHours = games.reduce((sum, game) => sum + (game.playtime_forever / 60), 0);
    const estimatedHours = games.reduce((sum, game) => sum + (game.hours_to_beat || 0), 0);
    const completedGames = games.filter(game => {
      if (!game.hours_to_beat) return false;
      return (game.playtime_forever / 60) >= (game.hours_to_beat * 0.9);
    }).length;

    const averageRating = games
      .filter(game => game.stars_rating)
      .reduce((sum, game) => sum + (game.stars_rating || 0), 0) / 
      games.filter(game => game.stars_rating).length;

    return {
      totalGames,
      totalHours: Math.round(totalHours),
      estimatedHours: Math.round(estimatedHours),
      completedGames,
      completionRate: Math.round((completedGames / totalGames) * 100),
      averageRating: Math.round(averageRating * 10) / 10,
      unplayedGames: games.filter(game => game.playtime_forever === 0).length
    };
  }
}

export const metricsService = new MetricsService();
