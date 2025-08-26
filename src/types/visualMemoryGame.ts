export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type GamePhase = 'setup' | 'display' | 'question1' | 'question2' | 'question3' | 'question4' | 'results';

export interface GameImage {
  id: string;
  emoji: string;
  name: string;
  color: string;
  colorVariants: string[]; // Pour les questions de difficulté 2
}

export interface GameSettings {
  difficulty: DifficultyLevel;
  displayDuration: number; // En secondes
  numberOfImages: number; // 4, 7, ou 10 selon la difficulté
}

export interface ImageInSequence {
  image: GameImage;
  position: number; // Position dans la série (0-based)
  originalColor: string;
}

export interface GameState {
  phase: GamePhase;
  settings: GameSettings;
  imageSequence: ImageInSequence[];
  currentQuestionIndex: number;
  
  // Scores
  score: number;
  phase1Score: number; // Questions de difficulté 1 (1 point)
  phase2Score: number; // Questions de difficulté 2 (2 points)  
  phase3Score: number; // Questions de difficulté 3 (3 points)
  phase4Score: number; // Questions de difficulté 4 (1-2 points)
  bonusPoints: number; // 15 points + bonus temporel
  
  // État des questions
  questionsAsked: number;
  questionsAnswered: number;
  correctAnswers: number;
  
  // Phase 2 et 3 - Questions multiples
  phase2Questions: number; // Nombre de questions déjà posées en phase 2
  phase3Questions: number; // Nombre de questions déjà posées en phase 3
  phase2MaxQuestions: number; // Nombre maximum de questions en phase 2 (3)
  phase3MaxQuestions: number; // Nombre maximum de questions en phase 3 (5)
  usedImagesInPhase: string[]; // Images déjà utilisées dans la phase courante
  
  // Phase 4 spécifique
  phase4Attempts: number;
  phase4TimeLimit: number; // 60 secondes
  phase4StartTime: number;
  phase4Images: GameImage[]; // Images mélangées (vraies + fausses)
  userSequence: (GameImage | null)[]; // Séquence que l'utilisateur construit
  
  // État du jeu
  startTime: number;
  endTime: number;
}

export interface QuestionResult {
  questionType: 'difficulty1' | 'difficulty2' | 'difficulty3' | 'difficulty4';
  imageShown: GameImage;
  correctAnswer: boolean | number | GameImage[]; // Dépend du type de question
  userAnswer: boolean | number | GameImage[]; // Réponse de l'utilisateur
  isCorrect: boolean;
  points: number;
  timeSpent: number; // En millisecondes
}

export interface GameResult {
  difficulty: DifficultyLevel;
  totalScore: number;
  phase1Score: number;
  phase2Score: number;
  phase3Score: number;
  phase4Score: number;
  bonusPoints: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number; // Pourcentage
  totalTime: number; // En millisecondes
  phase4Time?: number; // Temps pour la phase 4 uniquement
  questions: QuestionResult[];
  completedPhase4: boolean;
  phase4Attempts: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  bestScore: number;
  bestTotalPoints: number;
  gamesPlayed: number;
  rankPosition: number;
}

export interface GameSession {
  id: string;
  userId: string;
  difficulty: DifficultyLevel;
  score: number;
  bonusPoints: number;
  totalPoints: number;
  completionTime?: number; // Pour phase 4
  questionsAnswered: number;
  questionsCorrect: number;
  phase4Attempts: number;
  phase4Completed: boolean;
  createdAt: string;
}