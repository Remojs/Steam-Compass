import { Game } from '../hooks/useSortFilter';

// Services
import { SupabaseService } from './supabaseService';

// Mock game data with Steam-like games (temporary until real API integration)
export const mockGames: Game[] = [
  {
    id: '1',
    name: 'The Witcher 3: Wild Hunt',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop',
    estimatedHours: 100,
    metascore: 93,
    stars: 5,
    positivePercentage: 97
  },
  {
    id: '2',
    name: 'Red Dead Redemption 2',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=400&fit=crop',
    estimatedHours: 60,
    metascore: 97,
    stars: 5,
    positivePercentage: 95
  },
  {
    id: '3',
    name: 'Cyberpunk 2077',
    cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop',
    estimatedHours: 50,
    metascore: 86,
    stars: 4,
    positivePercentage: 78
  },
  {
    id: '4',
    name: 'Half-Life: Alyx',
    cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=400&fit=crop',
    estimatedHours: 15,
    metascore: 93,
    stars: 5,
    positivePercentage: 98
  },
  {
    id: '5',
    name: 'Portal 2',
    cover: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=400&fit=crop',
    estimatedHours: 8,
    metascore: 95,
    stars: 5,
    positivePercentage: 99
  },
  {
    id: '6',
    name: 'Doom Eternal',
    cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop',
    estimatedHours: 25,
    metascore: 88,
    stars: 4,
    positivePercentage: 87
  },
  {
    id: '7',
    name: 'Counter-Strike 2',
    cover: 'https://images.unsplash.com/photo-1542751371-4d0e8cf2e4d8?w=300&h=400&fit=crop',
    estimatedHours: 200,
    metascore: 81,
    stars: 4,
    positivePercentage: 84
  },
  {
    id: '8',
    name: 'Baldur\'s Gate 3',
    cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&h=400&fit=crop',
    estimatedHours: 75,
    metascore: 96,
    stars: 5,
    positivePercentage: 96
  }
];

/**
 * Fetch games data (currently using mock data)
 * TODO: Replace with real Steam API integration
 */
export const fetchGames = async (): Promise<Game[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return mockGames;
};

/**
 * Fetch user's Steam library
 * TODO: Implement real Steam API integration
 */
export const fetchSteamLibrary = async (steamId: string): Promise<Game[]> => {
  try {
    // This will be implemented when Steam API is configured
    console.log('Fetching Steam library for:', steamId);
    
    // For now, return mock data
    return mockGames;
  } catch (error) {
    console.error('Error fetching Steam library:', error);
    throw error;
  }
};

/**
 * Enrich game data with external API information
 * TODO: Integrate with RAWG API for Metacritic scores
 */
export const enrichGameData = async (games: Game[]): Promise<Game[]> => {
  try {
    // This will process games through various APIs to get:
    // - Metacritic scores from RAWG
    // - Estimated completion times from HLTB
    // - Steam review data
    // - Calculate star ratings
    
    console.log('Enriching game data...');
    
    // For now, return games as-is
    return games;
  } catch (error) {
    console.error('Error enriching game data:', error);
    return games;
  }
};

/**
 * Save games to database
 * TODO: Implement Supabase integration
 */
export const saveGamesToDatabase = async (userId: string, games: Game[]): Promise<void> => {
  try {
    console.log('Saving games to database for user:', userId);
    
    // This will save enriched game data to Supabase
    // Implementation pending Supabase configuration
  } catch (error) {
    console.error('Error saving games to database:', error);
    throw error;
  }
};

// Export services for direct use if needed
export {
  SupabaseService
};