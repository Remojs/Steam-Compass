// Type definitions for the application

export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  steam_id?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  steam_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  user_id: string;
  appid: number;
  name: string;
  cover_url?: string;
  playtime_forever: number;
  completion_time?: number;
  metacritic_score?: number;
  review_percentage?: number;
  stars_rating?: number;
  quality_score?: number;
  last_updated?: string;
  updated_at: string;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  img_icon_url?: string;
  img_logo_url?: string;
}

export interface SteamApiResponse {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

export interface RAWGGame {
  id: number;
  name: string;
  metacritic?: number;
  background_image?: string;
  rating: number;
  ratings_count: number;
}

export interface SteamReview {
  recommendationid: string;
  review: string;
  voted_up: boolean;
  votes_up: number;
  votes_funny: number;
  weighted_vote_score: string;
}

export interface SteamReviewsResponse {
  query_summary: {
    num_reviews: number;
    review_score: number;
    review_score_desc: string;
    total_positive: number;
    total_negative: number;
    total_reviews: number;
  };
  reviews: SteamReview[];
}

export interface GameMetrics {
  estimatedHours: number;
  metascore: number;
  stars: number;
  positivePercentage: number;
}

export interface GameDataResult {
  appid: number;
  name: string;
  horas: number;
  metascore: number | null;
  userscore: number | null;
  total_positive: number;
  total_negative: number;
  stars: number;
}
