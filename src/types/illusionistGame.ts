export interface ColorWord {
  word: string;
  color: string;
}

export interface GameConfig {
  wordDisplayTime: number; // in seconds
  totalWords: number;
}

export interface GameState {
  phase: 'setup' | 'playing' | 'bonus' | 'results';
  currentWordIndex: number;
  score: number;
  answers: boolean[];
  words: ColorWord[];
  availableColors: string[];
  firstWord: string | null;
  bonusAnswer: string | null;
  bonusCorrect: boolean;
  config: GameConfig;
}

export interface GameResult {
  totalScore: number;
  correctAnswers: number;
  bonusCorrect: boolean;
  maxScore: number;
}