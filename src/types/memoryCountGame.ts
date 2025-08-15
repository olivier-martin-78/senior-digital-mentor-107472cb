export interface GameSettings {
  numberOfImages: number; // 3-8
  totalDisplays: number; // 10-30
  displayDuration: number; // 0.5-5.0 seconds
}

export interface GameImage {
  id: string;
  emoji: string;
  name: string;
}

export interface ImageSequence {
  image: GameImage;
  order: number;
}

export interface GameState {
  phase: 'setup' | 'playing' | 'questions' | 'bonus' | 'results';
  settings: GameSettings;
  selectedImages: GameImage[];
  imageSequence: ImageSequence[];
  imageCounts: Record<string, number>;
  currentQuestionIndex: number;
  userAnswers: Record<string, number>;
  score: number;
  bonusQuestion: {
    type: 'first' | 'last';
    correctAnswer: string;
    userAnswer: string | null;
    correct: boolean;
  } | null;
  startTime: number;
  endTime: number;
}

export interface QuestionResult {
  imageId: string;
  correctCount: number;
  userAnswer: number;
  correct: boolean;
  points: number;
}

export interface GameResult {
  score: number;
  maxScore: number;
  bonusPoints: number;
  totalPoints: number;
  questions: QuestionResult[];
  bonusCorrect: boolean;
  duration: number;
  settings: GameSettings;
}