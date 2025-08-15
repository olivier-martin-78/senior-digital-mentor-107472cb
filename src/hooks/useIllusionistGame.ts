import { useState, useEffect, useCallback } from 'react';
import { GameState, GameConfig, ColorWord } from '@/types/illusionistGame';
import { COLOR_WORDS, getRandomColor, shuffleArray } from '@/data/colorWords';
import { UserActionsService } from '@/services/UserActionsService';

const DEFAULT_CONFIG: GameConfig = {
  wordDisplayTime: 2,
  totalWords: 10
};

export const useIllusionistGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    currentWordIndex: 0,
    score: 0,
    answers: [],
    words: [],
    availableColors: [],
    firstWord: null,
    bonusAnswer: null,
    bonusCorrect: false,
    config: DEFAULT_CONFIG
  });

  const [timeLeft, setTimeLeft] = useState(0);

  const initializeGame = useCallback((config: GameConfig) => {
    const shuffledWords = shuffleArray(COLOR_WORDS).slice(0, config.totalWords);
    const gameWords: ColorWord[] = shuffledWords.map(word => ({
      word,
      color: getRandomColor(word)
    }));

    setGameState({
      phase: 'playing',
      currentWordIndex: 0,
      score: 0,
      answers: [],
      words: gameWords,
      availableColors: shuffleArray(COLOR_WORDS),
      firstWord: gameWords[0]?.word || null,
      bonusAnswer: null,
      bonusCorrect: false,
      config
    });

    setTimeLeft(config.wordDisplayTime);

    // Track game start
    UserActionsService.trackUserAction(
      'view',
      'activity',
      'illusionist-game',
      'Jeu L\'Illusionniste - Démarrage',
      { config }
    );
  }, []);

  const selectAnswer = useCallback((selectedColor: string) => {
    if (gameState.phase !== 'playing') return;

    const currentWord = gameState.words[gameState.currentWordIndex];
    const isCorrect = selectedColor === currentWord.word;
    
    const newAnswers = [...gameState.answers, isCorrect];
    const newScore = gameState.score + (isCorrect ? 1 : 0);
    
    if (gameState.currentWordIndex >= gameState.words.length - 1) {
      // Game finished, go to bonus
      setGameState(prev => ({
        ...prev,
        phase: 'bonus',
        answers: newAnswers,
        score: newScore
      }));
    } else {
      // Next word
      setGameState(prev => ({
        ...prev,
        currentWordIndex: prev.currentWordIndex + 1,
        answers: newAnswers,
        score: newScore
      }));
      setTimeLeft(gameState.config.wordDisplayTime);
    }
  }, [gameState]);

  const answerBonus = useCallback((bonusAnswer: string) => {
    const bonusCorrect = bonusAnswer === gameState.firstWord;
    const finalScore = gameState.score + (bonusCorrect ? 4 : 0);

    setGameState(prev => ({
      ...prev,
      phase: 'results',
      bonusAnswer,
      bonusCorrect,
      score: finalScore
    }));

    // Track game completion
    UserActionsService.trackUserAction(
      'view',
      'activity',
      'illusionist-game',
      'Jeu L\'Illusionniste - Terminé',
      { 
        score: finalScore,
        maxScore: gameState.config.totalWords + 4,
        bonusCorrect
      }
    );
  }, [gameState]);

  const restartGame = useCallback(() => {
    initializeGame(gameState.config);
  }, [gameState.config, initializeGame]);

  const resetToSetup = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'setup'
    }));
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState.phase !== 'playing' || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 0.1);
    }, 100);

    return () => clearTimeout(timer);
  }, [gameState.phase, timeLeft]);

  // Auto-advance when time runs out
  useEffect(() => {
    if (gameState.phase === 'playing' && timeLeft <= 0) {
      selectAnswer(''); // Wrong answer
    }
  }, [gameState.phase, timeLeft, selectAnswer]);

  return {
    gameState,
    timeLeft,
    initializeGame,
    selectAnswer,
    answerBonus,
    restartGame,
    resetToSetup
  };
};