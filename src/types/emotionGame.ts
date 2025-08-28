export interface EmotionImage {
  id: string;
  image_url: string;
  emotion_name: string;
  intensity: string; // Changed from union type to string to match database
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface EmotionGameQuestion {
  image: EmotionImage;
  position: number;
}

export interface EmotionGameSession {
  id?: string;
  user_id: string;
  score: number;
  emotion_correct: number;
  intensity_correct: number;
  total_questions: number;
  completion_time?: number;
  session_data: Record<string, any>;
  created_at?: string;
}

export interface EmotionLeaderboard {
  user_id: string;
  best_score: number;
  best_total_points: number;
  games_played: number;
  user_name: string;
  rank_position: number;
}

export type GamePhase = 'setup' | 'playing' | 'results';

export interface GameStats {
  emotionCorrect: number;
  intensityCorrect: number;
  totalScore: number;
  completionTime: number;
}