import { env } from '../lib/env';
import { 
  SteamApiResponse, 
  SteamReviewsResponse, 
  SteamGame 
} from '../lib/types';

/**
 * Steam Web API service
 * Handles all interactions with Steam's official API
 */
class SteamApiService {
  private baseUrl = 'https://api.steampowered.com';
  private storeUrl = 'https://store.steampowered.com/api';

  /**
   * Get owned games for a Steam user
   */
  async getOwnedGames(steamId: string): Promise<SteamGame[]> {
    try {
      const url = new URL(`${this.baseUrl}/IPlayerService/GetOwnedGames/v0001/`);
      url.searchParams.append('key', env.apis.steamApiKey);
      url.searchParams.append('steamid', steamId);
      url.searchParams.append('format', 'json');
      url.searchParams.append('include_appinfo', 'true');
      url.searchParams.append('include_played_free_games', 'true');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Steam API error: ${response.status}`);
      }

      const data: SteamApiResponse = await response.json();
      return data.response.games || [];
    } catch (error) {
      console.error('Error fetching Steam games:', error);
      throw error;
    }
  }

  /**
   * Get Steam user profile information
   */
  async getUserProfile(steamId: string) {
    try {
      const url = new URL(`${this.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/`);
      url.searchParams.append('key', env.apis.steamApiKey);
      url.searchParams.append('steamids', steamId);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Steam API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response.players[0];
    } catch (error) {
      console.error('Error fetching Steam profile:', error);
      throw error;
    }
  }

  /**
   * Get game reviews from Steam
   */
  async getGameReviews(appId: number): Promise<SteamReviewsResponse> {
    try {
      const url = new URL(`${this.storeUrl}/appreviews/${appId}`);
      url.searchParams.append('json', '1');
      url.searchParams.append('language', 'english');
      url.searchParams.append('num_per_page', '100');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Steam Reviews API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Steam reviews:', error);
      throw error;
    }
  }

  /**
   * Get game details from Steam Store
   */
  async getGameDetails(appId: number) {
    try {
      const url = new URL(`${this.storeUrl}/appdetails`);
      url.searchParams.append('appids', appId.toString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Steam Store API error: ${response.status}`);
      }

      const data = await response.json();
      return data[appId]?.data;
    } catch (error) {
      console.error('Error fetching Steam game details:', error);
      throw error;
    }
  }

  /**
   * Generate Steam CDN image URL
   */
  getGameImageUrl(appId: number, imageHash: string, size: 'icon' | 'logo' | 'header' = 'header'): string {
    const baseUrl = 'https://media.steampowered.com/steamcommunity/public/images/apps';
    
    switch (size) {
      case 'icon':
        return `${baseUrl}/${appId}/${imageHash}.jpg`;
      case 'logo':
        return `${baseUrl}/${appId}/${imageHash}.jpg`;
      case 'header':
      default:
        return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
    }
  }
}

export const steamApi = new SteamApiService();
