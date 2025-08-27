export interface GameSound {
  id: string;
  name: string;
  file_url: string;
  category: string;
  type: 'original' | 'variant';
  description?: string;
}

export type GamePhase = 'setup' | 'playing' | 'input' | 'selection' | 'results';

export interface QuestionResult {
  soundId: string;
  soundName: string;
  userInput: string;
  selectedLabel?: string;
  isCorrect: boolean;
  points: number;
  type: 'exact' | 'label' | 'incorrect';
}

export interface GameState {
  phase: GamePhase;
  currentSoundIndex: number;
  sounds: GameSound[];
  questionResults: QuestionResult[];
  score: number;
  exactMatches: number;
  labelMatches: number;
  consecutiveCorrect: number;
  maxConsecutive: number;
  startTime?: number;
  endTime?: number;
  showLabels: boolean;
  currentSound?: GameSound;
  userInput: string;
  audioProgress: number;
}

export interface GameSession {
  id: string;
  user_id: string;
  score: number;
  total_sounds: number;
  correct_answers: number;
  exact_matches: number;
  label_matches: number;
  consecutive_bonus: number;
  max_consecutive: number;
  sounds_used: string[];
  session_data: any;
  completion_time?: number;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  best_score: number;
  best_total_points: number;
  games_played: number;
  user_name: string;
  rank_position: number;
}