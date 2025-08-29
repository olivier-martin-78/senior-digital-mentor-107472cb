export interface WordMagicLevel {
  id: string;
  level_number: number;
  letters: string; // "T,E,R,R,E"
  grid_layout: GridCell[][];
  solutions: string[];
  bonus_words: string[];
  difficulty: 'facile' | 'moyen' | 'difficile';
  created_at: string;
  updated_at: string;
}

export interface GridCell {
  letter: string | null;
  isRevealed: boolean;
  wordId?: string;
  x: number;
  y: number;
}

export interface WordMagicProgress {
  id: string;
  user_id: string;
  level_number: number;
  score: number;
  words_found: number;
  bonus_words_found: number;
  completed: boolean;
  completion_time?: number;
  created_at: string;
  updated_at: string;
}

export interface WordMagicGameSession {
  id: string;
  user_id: string;
  level_number: number;
  score: number;
  words_found: number;
  bonus_words_found: number;
  total_words: number;
  completion_time?: number;
  session_data: any;
  completed: boolean;
  created_at: string;
}

export interface WordMagicLeaderboard {
  user_id: string;
  best_score: number;
  total_levels_completed: number;
  games_played: number;
  best_completion_time?: number;
  user_name: string;
  rank_position: number;
}

export interface GameStats {
  score: number;
  words_found: number;
  bonus_words_found: number;
  total_words: number;
  completion_time?: number;
}

export type GamePhase = 'setup' | 'playing' | 'results';

export interface SelectedLetter {
  letter: string;
  index: number;
}

export interface WordFormation {
  word: string;
  isValid: boolean;
  isBonus?: boolean;
  points: number;
}