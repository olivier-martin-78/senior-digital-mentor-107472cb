import { useState, useCallback } from 'react';
import { GameState, GameSettings, GameImage, QuestionResult, GameResult } from '@/types/memoryCountGame';
import { getRandomImages, generateImageSequence } from '@/data/memoryImages';
import { UserActionsService } from '@/services/UserActionsService';

const initialSettings: GameSettings = {
  numberOfImages: 4,
  totalDisplays: 15,
  displayDuration: 2.0
};

export const useMemoryCountGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    settings: initialSettings,
    selectedImages: [],
    imageSequence: [],
    imageCounts: {},
    currentQuestionIndex: 0,
    userAnswers: {},
    score: 0,
    bonusQuestion: null,
    startTime: 0,
    endTime: 0
  });

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setGameState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  const startGame = useCallback(() => {
    const images = getRandomImages(gameState.settings.numberOfImages);
    const { sequence, counts } = generateImageSequence(images, gameState.settings.totalDisplays);
    
    // Generate bonus question
    const bonusType = Math.random() > 0.5 ? 'first' : 'last';
    const correctAnswer = bonusType === 'first' 
      ? sequence[0].image.id 
      : sequence[sequence.length - 1].image.id;

    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      selectedImages: images,
      imageSequence: sequence,
      imageCounts: counts,
      currentQuestionIndex: 0,
      userAnswers: {},
      score: 0,
      bonusQuestion: {
        type: bonusType,
        correctAnswer,
        userAnswer: null,
        correct: false
      },
      startTime: Date.now()
    }));

    // Track game start
    UserActionsService.trackView('activity', 'memory-count-game', 'Combien de fois...');
  }, [gameState.settings]);

  const finishPlaying = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'questions'
    }));
  }, []);

  const answerQuestion = useCallback((imageId: string, answer: number) => {
    setGameState(prev => {
      const newAnswers = { ...prev.userAnswers, [imageId]: answer };
      const correctCount = prev.imageCounts[imageId] || 0;
      const isCorrect = answer === correctCount;
      const newScore = prev.score + (isCorrect ? 1 : 0);
      
      const nextIndex = prev.currentQuestionIndex + 1;
      const isLastQuestion = nextIndex >= prev.selectedImages.length;
      
      return {
        ...prev,
        userAnswers: newAnswers,
        score: newScore,
        currentQuestionIndex: nextIndex,
        phase: isLastQuestion ? 'bonus' : 'questions'
      };
    });
  }, []);

  const answerBonusQuestion = useCallback((imageId: string) => {
    setGameState(prev => {
      if (!prev.bonusQuestion) return prev;
      
      const isCorrect = imageId === prev.bonusQuestion.correctAnswer;
      const bonusPoints = isCorrect ? 4 : 0;
      
      return {
        ...prev,
        bonusQuestion: {
          ...prev.bonusQuestion,
          userAnswer: imageId,
          correct: isCorrect
        },
        phase: 'results',
        endTime: Date.now()
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      phase: 'setup',
      settings: initialSettings,
      selectedImages: [],
      imageSequence: [],
      imageCounts: {},
      currentQuestionIndex: 0,
      userAnswers: {},
      score: 0,
      bonusQuestion: null,
      startTime: 0,
      endTime: 0
    });
  }, []);

  const getGameResult = useCallback((): GameResult => {
    const questions: QuestionResult[] = gameState.selectedImages.map(image => {
      const correctCount = gameState.imageCounts[image.id] || 0;
      const userAnswer = gameState.userAnswers[image.id] || 0;
      const correct = userAnswer === correctCount;
      
      return {
        imageId: image.id,
        correctCount,
        userAnswer,
        correct,
        points: correct ? 1 : 0
      };
    });
    
    const bonusPoints = gameState.bonusQuestion?.correct ? 4 : 0;
    const duration = gameState.endTime - gameState.startTime;
    
    return {
      score: gameState.score,
      maxScore: gameState.selectedImages.length,
      bonusPoints,
      totalPoints: gameState.score + bonusPoints,
      questions,
      bonusCorrect: gameState.bonusQuestion?.correct || false,
      duration,
      settings: gameState.settings
    };
  }, [gameState]);

  return {
    gameState,
    updateSettings,
    startGame,
    finishPlaying,
    answerQuestion,
    answerBonusQuestion,
    resetGame,
    getGameResult
  };
};