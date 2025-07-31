/**
 * HowLongToBeat service
 * Since HLTB doesn't have an official API, this service provides utilities
 * to estimate game completion times and integrates with community data
 */

interface HLTBEstimate {
  main: number; // Main story hours
  extra: number; // Main + extras hours
  completionist: number; // 100% completion hours
}

/**
 * Game completion time estimates
 * These are fallback estimates when HLTB data is not available
 */
const GAME_TIME_ESTIMATES: Record<string, HLTBEstimate> = {
  // Open World RPGs
  'The Witcher 3: Wild Hunt': { main: 51, extra: 103, completionist: 173 },
  'Red Dead Redemption 2': { main: 50, extra: 79, completionist: 176 },
  'Cyberpunk 2077': { main: 21, extra: 60, completionist: 103 },
  'Baldur\'s Gate 3': { main: 75, extra: 96, completionist: 141 },

  // Linear Games
  'Portal 2': { main: 8, extra: 11, completionist: 17 },
  'Half-Life: Alyx': { main: 15, extra: 18, completionist: 24 },
  'Doom Eternal': { main: 14, extra: 25, completionist: 27 },

  // Multiplayer/Endless
  'Counter-Strike 2': { main: 0, extra: 0, completionist: 0 }, // Multiplayer
  'Dota 2': { main: 0, extra: 0, completionist: 0 }, // Multiplayer
  'Team Fortress 2': { main: 0, extra: 0, completionist: 0 }, // Multiplayer
};

class HowLongToBeatService {
  /**
   * Get estimated completion time for a game
   */
  getEstimatedTime(gameName: string, completionType: 'main' | 'extra' | 'completionist' = 'main'): number {
    const estimate = GAME_TIME_ESTIMATES[gameName];
    
    if (estimate) {
      return estimate[completionType];
    }

    // Fallback estimation based on game name patterns
    return this.estimateByCategory(gameName, completionType);
  }

  /**
   * Estimate time based on game category/genre patterns
   */
  private estimateByCategory(gameName: string, completionType: 'main' | 'extra' | 'completionist'): number {
    const name = gameName.toLowerCase();
    
    // Multiplayer games
    if (this.isMultiplayerGame(name)) {
      return 0; // No completion time for multiplayer games
    }

    // RPG patterns
    if (this.isRPG(name)) {
      return completionType === 'main' ? 40 : completionType === 'extra' ? 70 : 120;
    }

    // Action/Adventure
    if (this.isActionAdventure(name)) {
      return completionType === 'main' ? 15 : completionType === 'extra' ? 25 : 40;
    }

    // Puzzle games
    if (this.isPuzzleGame(name)) {
      return completionType === 'main' ? 8 : completionType === 'extra' ? 12 : 20;
    }

    // Strategy games
    if (this.isStrategyGame(name)) {
      return completionType === 'main' ? 25 : completionType === 'extra' ? 45 : 80;
    }

    // Default estimate
    return completionType === 'main' ? 20 : completionType === 'extra' ? 35 : 50;
  }

  private isMultiplayerGame(name: string): boolean {
    const multiplayerKeywords = [
      'counter-strike', 'dota', 'team fortress', 'csgo', 'cs2',
      'multiplayer', 'online', 'mmo', 'battle royale', 'pvp'
    ];
    return multiplayerKeywords.some(keyword => name.includes(keyword));
  }

  private isRPG(name: string): boolean {
    const rpgKeywords = [
      'witcher', 'elder scrolls', 'fallout', 'final fantasy', 'dragon age',
      'mass effect', 'divinity', 'baldur', 'persona', 'rpg'
    ];
    return rpgKeywords.some(keyword => name.includes(keyword));
  }

  private isActionAdventure(name: string): boolean {
    const actionKeywords = [
      'call of duty', 'battlefield', 'doom', 'half-life', 'portal',
      'tomb raider', 'assassin', 'gta', 'red dead'
    ];
    return actionKeywords.some(keyword => name.includes(keyword));
  }

  private isPuzzleGame(name: string): boolean {
    const puzzleKeywords = [
      'portal', 'tetris', 'puzzle', 'the witness', 'baba is you'
    ];
    return puzzleKeywords.some(keyword => name.includes(keyword));
  }

  private isStrategyGame(name: string): boolean {
    const strategyKeywords = [
      'civilization', 'total war', 'age of empires', 'starcraft',
      'strategy', 'crusader kings', 'europa universalis'
    ];
    return strategyKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Calculate estimated time based on actual playtime
   * For games where we have playtime data but no HLTB data
   */
  estimateFromPlaytime(playtimeMinutes: number): number {
    const playtimeHours = Math.round(playtimeMinutes / 60);
    
    // If player has significant playtime, use that as estimate
    if (playtimeHours > 10) {
      return Math.round(playtimeHours * 0.8); // Assume 80% completion
    }

    return playtimeHours;
  }
}

export const hltbService = new HowLongToBeatService();
