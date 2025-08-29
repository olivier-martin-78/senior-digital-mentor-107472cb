import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserActionsService } from '@/services/UserActionsService';
import { useToast } from '@/hooks/use-toast';
import { 
  WordMagicLevel, 
  GameStats, 
  GamePhase, 
  WordMagicGameSession,
  WordMagicProgress,
  SelectedLetter,
  WordFormation,
  GridCell
} from '@/types/wordMagicGame';

export const useWordMagicGame = (initialLevel?: WordMagicLevel) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [currentLevel, setCurrentLevel] = useState<WordMagicLevel | null>(initialLevel || null);
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    words_found: 0,
    bonus_words_found: 0,
    total_words: 0
  });
  
  // Game play state
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [selectedLetters, setSelectedLetters] = useState<SelectedLetter[]>([]);
  const [gameGrid, setGameGrid] = useState<GridCell[][]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize game with level
  const initializeGame = useCallback(async (level: WordMagicLevel) => {
    try {
      console.log('🎯 Initializing Word Magic game with level:', level.level_number);
      
      setCurrentLevel(level);
      setFoundWords([]);
      setCurrentWord('');
      setSelectedLetters([]);
      setStartTime(new Date());
      
      // Initialize grid from level layout
      const initialGrid: GridCell[][] = level.grid_layout.map((row, y) => 
        row.map((cell, x) => ({
          letter: null,
          isRevealed: false,
          x,
          y
        }))
      );
      
      setGameGrid(initialGrid);
      
      setGameStats({
        score: 0,
        words_found: 0,
        bonus_words_found: 0,
        total_words: level.solutions.length
      });
      
      setGamePhase('playing');

      // Track game start
      if (user) {
        await UserActionsService.trackUserAction(
          'create',
          'activity',
          `word_magic_${level.level_number}`,
          `Niveau ${level.level_number} - La Magie des Mots`,
          { 
            level_number: level.level_number,
            difficulty: level.difficulty,
            action: 'game_start'
          }
        );
      }

    } catch (error) {
      console.error('❌ Error initializing game:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'initialiser le jeu",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Handle letter selection
  const selectLetter = useCallback((letter: string, index: number) => {
    setSelectedLetters(prev => [...prev, { letter, index }]);
    setCurrentWord(prev => prev + letter);
  }, []);

  // Handle letter deselection
  const deselectLetter = useCallback((index: number) => {
    setSelectedLetters(prev => prev.filter(sel => sel.index !== index));
    setCurrentWord(prev => {
      const letterIndex = selectedLetters.findIndex(sel => sel.index === index);
      if (letterIndex !== -1) {
        return prev.slice(0, letterIndex) + prev.slice(letterIndex + 1);
      }
      return prev;
    });
  }, [selectedLetters]);

  // Clear current word selection
  const clearSelection = useCallback(() => {
    setSelectedLetters([]);
    setCurrentWord('');
  }, []);

  // Submit current word
  const submitWord = useCallback(async () => {
    if (!currentLevel || !currentWord || currentWord.length < 3) {
      clearSelection();
      return;
    }

    const wordToCheck = currentWord.toUpperCase();
    
    // Check if word already found
    if (foundWords.includes(wordToCheck)) {
      toast({
        title: "Mot déjà trouvé",
        description: `"${wordToCheck}" a déjà été trouvé !`,
        variant: "default"
      });
      clearSelection();
      return;
    }

    // Check if word is in solutions
    const isValidSolution = currentLevel.solutions.includes(wordToCheck);
    const isBonusWord = currentLevel.bonus_words.includes(wordToCheck);
    
    if (isValidSolution || isBonusWord) {
      // Valid word found!
      const points = calculateWordPoints(wordToCheck, isBonusWord);
      
      setFoundWords(prev => [...prev, wordToCheck]);
      setGameStats(prev => ({
        ...prev,
        score: prev.score + points,
        words_found: prev.words_found + 1,
        bonus_words_found: prev.bonus_words_found + (isBonusWord ? 1 : 0)
      }));
      
      // Update grid to show the found word
      updateGridWithFoundWord(wordToCheck);
      
      toast({
        title: `Mot trouvé ! ${isBonusWord ? '🌟 BONUS' : ''}`,
        description: `"${wordToCheck}" (+${points} points)`,
        variant: "default"
      });

      // Track word found
      if (user) {
        await UserActionsService.trackUserAction(
          'update',
          'activity',
          `word_magic_${currentLevel.level_number}`,
          `Mot trouvé: ${wordToCheck}`,
          { 
            word: wordToCheck,
            is_bonus: isBonusWord,
            points,
            level_number: currentLevel.level_number,
            action: 'word_found'
          }
        );
      }
      
    } else {
      // Invalid word
      toast({
        title: "Mot non valide",
        description: `"${wordToCheck}" ne fait pas partie des solutions`,
        variant: "destructive"
      });
    }
    
    clearSelection();
  }, [currentLevel, currentWord, foundWords, user, toast, clearSelection]);

  // Calculate points for a word
  const calculateWordPoints = (word: string, isBonus: boolean): number => {
    let basePoints = word.length * 10; // 10 points per letter
    if (isBonus) basePoints *= 2; // Double points for bonus words
    return basePoints;
  };

  // Update grid with found word
  const updateGridWithFoundWord = (word: string) => {
    // This is a simplified version - in a real implementation,
    // you would need to determine the exact position of the word in the grid
    // based on the grid_layout and word positioning logic
    console.log('📝 Word found, updating grid:', word);
  };

  // Save game session to database
  const saveGameSession = useCallback(async (finalStats: GameStats, completed: boolean = false) => {
    if (!user || !currentLevel) return;

    setIsSubmitting(true);

    try {
      const completionTime = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : undefined;

      // Save game session
      const { error: sessionError } = await supabase
        .from('word_magic_game_sessions')
        .insert({
          user_id: user.id,
          level_number: currentLevel.level_number,
          score: finalStats.score,
          words_found: finalStats.words_found,
          bonus_words_found: finalStats.bonus_words_found,
          total_words: finalStats.total_words,
          completion_time: completionTime,
          completed,
          session_data: {
            found_words: foundWords,
            difficulty: currentLevel.difficulty
          }
        });

      if (sessionError) {
        console.error('❌ Error saving session:', sessionError);
        throw sessionError;
      }

      // Update or create progress record
      const { error: progressError } = await supabase
        .from('word_magic_progress')
        .upsert({
          user_id: user.id,
          level_number: currentLevel.level_number,
          score: finalStats.score,
          words_found: finalStats.words_found,
          bonus_words_found: finalStats.bonus_words_found,
          completed,
          completion_time: completionTime
        });

      if (progressError && progressError.code !== '23505') { // Ignore duplicate key errors
        console.error('❌ Error updating progress:', progressError);
      }

      // Update leaderboard
      await updateLeaderboard(finalStats, completionTime);

      console.log('✅ Game session saved successfully');

    } catch (error) {
      console.error('❌ Error saving game session:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder votre progression",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, currentLevel, foundWords, startTime, toast]);

  // Update leaderboard
  const updateLeaderboard = async (stats: GameStats, completionTime?: number) => {
    if (!user) return;

    const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM format

    try {
      const { error } = await supabase
        .from('word_magic_leaderboards')
        .upsert({
          user_id: user.id,
          month_year: monthYear,
          best_score: stats.score,
          total_levels_completed: 1,
          games_played: 1,
          best_completion_time: completionTime
        });

      if (error && error.code !== '23505') {
        console.error('❌ Error updating leaderboard:', error);
      }
    } catch (error) {
      console.error('❌ Error updating leaderboard:', error);
    }
  };

  // Check if level is completed
  useEffect(() => {
    if (!currentLevel || gamePhase !== 'playing') return;

    const allMainWordsFound = currentLevel.solutions.every(word => 
      foundWords.includes(word.toUpperCase())
    );

    if (allMainWordsFound) {
      // Level completed!
      const finalStats = {
        ...gameStats,
        completion_time: startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : undefined
      };
      
      setGameStats(finalStats);
      saveGameSession(finalStats, true);
      setGamePhase('results');

      toast({
        title: "Niveau terminé ! 🎉",
        description: `Tous les mots ont été trouvés !`,
        variant: "default"
      });
    }
  }, [foundWords, currentLevel, gamePhase, gameStats, startTime, saveGameSession, toast]);

  // Reset game
  const resetGame = useCallback(() => {
    setGamePhase('setup');
    setCurrentLevel(null);
    setFoundWords([]);
    setCurrentWord('');
    setSelectedLetters([]);
    setGameGrid([]);
    setStartTime(null);
    setGameStats({
      score: 0,
      words_found: 0,
      bonus_words_found: 0,
      total_words: 0
    });
  }, []);

  return {
    // Game state
    gamePhase,
    currentLevel,
    gameStats,
    foundWords,
    currentWord,
    selectedLetters,
    gameGrid,
    isSubmitting,
    
    // Game actions
    initializeGame,
    selectLetter,
    deselectLetter,
    clearSelection,
    submitWord,
    resetGame,
    
    // Game status
    isGameActive: gamePhase === 'playing',
    isLevelCompleted: gamePhase === 'results',
    
    // Helper methods
    getAvailableLetters: () => currentLevel ? currentLevel.letters.split(',').map(l => l.trim()) : [],
    getRemainingWords: () => currentLevel ? currentLevel.solutions.filter(word => !foundWords.includes(word)) : [],
    getProgressPercentage: () => currentLevel && currentLevel.solutions.length > 0 
      ? Math.round((foundWords.filter(word => currentLevel.solutions.includes(word)).length / currentLevel.solutions.length) * 100)
      : 0
  };
};