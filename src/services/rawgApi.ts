import { env } from '../lib/env';
import { RAWGGame } from '../lib/types';

/**
 * RAWG API service
 * Handles integration with RAWG.io for game metadata including Metacritic scores
 */
class RAWGApiService {
  private baseUrl = 'https://api.rawg.io/api';

  /**
   * Search for a game by name
   */
  async searchGame(gameName: string): Promise<RAWGGame[]> {
    try {
      const url = new URL(`${this.baseUrl}/games`);
      url.searchParams.append('key', env.apis.rawgApiKey);
      url.searchParams.append('search', gameName);
      url.searchParams.append('page_size', '10');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`RAWG API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching RAWG games:', error);
      throw error;
    }
  }

  /**
   * Get game details by ID
   */
  async getGameDetails(gameId: number): Promise<RAWGGame> {
    try {
      const url = new URL(`${this.baseUrl}/games/${gameId}`);
      url.searchParams.append('key', env.apis.rawgApiKey);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`RAWG API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching RAWG game details:', error);
      throw error;
    }
  }

  /**
   * Get Metacritic score for a game by name
   * This method searches for the game and returns the best match's Metacritic score
   */
  async getMetacriticScore(gameName: string): Promise<number | null> {
    try {
      const games = await this.searchGame(gameName);
      
      if (games.length === 0) {
        return null;
      }

      // Find the best match (exact name match or highest rating)
      const bestMatch = games.find(game => 
        game.name.toLowerCase() === gameName.toLowerCase()
      ) || games[0];

      return bestMatch.metacritic || null;
    } catch (error) {
      console.error('Error fetching Metacritic score:', error);
      return null;
    }
  }
}

export const rawgApi = new RAWGApiService();
