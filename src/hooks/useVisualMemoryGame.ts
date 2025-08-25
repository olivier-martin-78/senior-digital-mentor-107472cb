import { useState, useCallback, useEffect } from 'react';
import { GameState, GameSettings, GameResult, DifficultyLevel, GamePhase, QuestionResult } from '@/types/visualMemoryGame';
import { generateImageSequence, generatePhase4Images, getDifficultyImageCount } from '@/data/visualMemoryImages';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserActionsService } from '@/services/UserActionsService';

const initialSettings: GameSettings = {
  difficulty: 'beginner',
  displayDuration: 10,
  numberOfImages: 4
};

export const useVisualMemoryGame = () => {
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    settings: initialSettings,
    imageSequence: [],
    currentQuestionIndex: 0,
    score: 0,
    phase1Score: 0,
    phase2Score: 0,
    phase3Score: 0,
    phase4Score: 0,
    bonusPoints: 0,
    questionsAsked: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    phase4Attempts: 0,
    phase4TimeLimit: 60,
    phase4StartTime: 0,
    phase4Images: [],
    userSequence: [],
    startTime: 0,
    endTime: 0
  });

  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setGameState(prev => ({
      ...prev,
      settings: { 
        ...prev.settings, 
        ...newSettings,
        numberOfImages: getDifficultyImageCount(newSettings.difficulty || prev.settings.difficulty)
      }
    }));
  }, []);

  const startGame = useCallback(async () => {
    // Récupérer les paramètres de durée d'affichage depuis la base de données
    const { data: gameSettings } = await supabase
      .from('game_settings')
      .select('visual_memory_display_duration')
      .single();

    const displayDuration = gameSettings?.visual_memory_display_duration || 10;
    
    const sequence = generateImageSequence(gameState.settings.difficulty);
    
    setGameState(prev => ({
      ...prev,
      phase: 'display',
      imageSequence: sequence,
      settings: {
        ...prev.settings,
        displayDuration
      },
      startTime: Date.now(),
      score: 0,
      phase1Score: 0,
      phase2Score: 0,
      phase3Score: 0,
      phase4Score: 0,
      bonusPoints: 0,
      questionsAsked: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      currentQuestionIndex: 0
    }));

    setQuestionResults([]);

    // Tracker le début du jeu
    UserActionsService.trackView('activity', 'visual-memory-game', `Jeu Mémoire Visuelle - ${gameState.settings.difficulty}`);
  }, [gameState.settings.difficulty]);

  const finishDisplay = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'question1'
    }));
  }, []);

  const answerQuestion1 = useCallback((answer: boolean, imageShown: any, isCorrect: boolean) => {
    const points = isCorrect ? 1 : 0;
    const timeSpent = Date.now() - gameState.startTime;

    const result: QuestionResult = {
      questionType: 'difficulty1',
      imageShown,
      correctAnswer: true, // Sera défini selon la logique
      userAnswer: answer,
      isCorrect,
      points,
      timeSpent
    };

    setQuestionResults(prev => [...prev, result]);

    setGameState(prev => ({
      ...prev,
      phase1Score: prev.phase1Score + points,
      score: prev.score + points,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      // Gérer la transition de phase ici directement
      ...(prev.currentQuestionIndex + 1 >= prev.imageSequence.length 
        ? { phase: 'question2', currentQuestionIndex: 0 }
        : { phase: prev.phase === 'question1' ? 'question2' : 'question1' })
    }));
  }, [gameState.startTime]);

  const answerQuestion2 = useCallback((answer: boolean, imageShown: any, isCorrect: boolean) => {
    const points = isCorrect ? 2 : 0;
    const timeSpent = Date.now() - gameState.startTime;

    const result: QuestionResult = {
      questionType: 'difficulty2',
      imageShown,
      correctAnswer: true,
      userAnswer: answer,
      isCorrect,
      points,
      timeSpent
    };

    setQuestionResults(prev => [...prev, result]);

    setGameState(prev => ({
      ...prev,
      phase2Score: prev.phase2Score + points,
      score: prev.score + points,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      // Gérer la transition de phase ici directement
      ...(prev.currentQuestionIndex + 1 >= prev.imageSequence.length 
        ? { phase: 'question3', currentQuestionIndex: 0 }
        : { phase: 'question1' })
    }));
  }, [gameState.startTime]);

  const answerQuestion3 = useCallback((position: number, imageShown: any, correctPosition: number) => {
    const isCorrect = position === correctPosition;
    const points = isCorrect ? 3 : 0;
    const timeSpent = Date.now() - gameState.startTime;

    const result: QuestionResult = {
      questionType: 'difficulty3',
      imageShown,
      correctAnswer: correctPosition,
      userAnswer: position,
      isCorrect,
      points,
      timeSpent
    };

    setQuestionResults(prev => [...prev, result]);

    setGameState(prev => ({
      ...prev,
      phase3Score: prev.phase3Score + points,
      score: prev.score + points,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      currentQuestionIndex: prev.currentQuestionIndex + 1
    }));

    setTimeout(() => {
      setGameState(prev => {
        if (prev.currentQuestionIndex >= prev.imageSequence.length) {
          // Préparer la phase 4
          const phase4Images = generatePhase4Images(prev.imageSequence);
          return {
            ...prev,
            phase: 'question4',
            phase4Images,
            userSequence: new Array(prev.imageSequence.length).fill(null),
            phase4StartTime: Date.now(),
            currentQuestionIndex: 0
          };
        }
        return prev;
      });
    }, 1500);
  }, [gameState.startTime]);

  const handlePhase4ImageClick = useCallback((clickedImage: any) => {
    setGameState(prev => {
      const newUserSequence = [...prev.userSequence];
      const nextEmptyIndex = newUserSequence.findIndex(item => item === null);
      
      if (nextEmptyIndex !== -1) {
        newUserSequence[nextEmptyIndex] = clickedImage;
      }
      
      return {
        ...prev,
        userSequence: newUserSequence
      };
    });
  }, []);

  const removePhase4Image = useCallback((index: number) => {
    setGameState(prev => {
      const newUserSequence = [...prev.userSequence];
      newUserSequence[index] = null;
      return {
        ...prev,
        userSequence: newUserSequence
      };
    });
  }, []);

  const verifyPhase4 = useCallback(() => {
    const { userSequence, imageSequence, phase4StartTime, phase4Attempts } = gameState;
    const currentTime = Date.now();
    const timeSpent = Math.floor((currentTime - phase4StartTime) / 1000);
    
    // Vérifier si toutes les positions sont remplies
    if (userSequence.some(item => item === null)) {
      toast({
        title: "Séquence incomplète",
        description: "Veuillez placer toutes les images avant de vérifier.",
        variant: "destructive"
      });
      return;
    }

    // Vérifier la séquence inversée
    const correctInversedSequence = [...imageSequence].reverse();
    let correctImages = 0;
    let correctPositions = 0;

    userSequence.forEach((userImage, index) => {
      const correctImage = correctInversedSequence[index].image;
      
      // Points pour image correcte (1 point)
      if (imageSequence.some(seq => seq.image.id === userImage?.id)) {
        correctImages++;
      }
      
      // Points pour position correcte ET image correcte (2 points)
      if (userImage?.id === correctImage.id) {
        correctPositions++;
      }
    });

    const phase4Score = correctImages + correctPositions;
    let bonusPoints = 0;

    // Bonus de 15 points si tout est correct
    const isPerfect = correctPositions === imageSequence.length;
    if (isPerfect) {
      bonusPoints += 15;
      // Bonus temporel (59 points max - temps écoulé)
      const timeBonus = Math.max(0, 59 - timeSpent);
      bonusPoints += timeBonus;
    }

    const newAttempts = phase4Attempts + 1;

    setGameState(prev => ({
      ...prev,
      phase4Score: prev.phase4Score + phase4Score,
      bonusPoints: prev.bonusPoints + bonusPoints,
      score: prev.score + phase4Score + bonusPoints,
      phase4Attempts: newAttempts,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isPerfect ? 1 : 0)
    }));

    if (isPerfect || newAttempts >= 3) {
      // Fin du jeu
      setGameState(prev => ({
        ...prev,
        phase: 'results',
        endTime: Date.now()
      }));
      
      // Sauvegarder le score
      saveGameSession(gameState.settings.difficulty, gameState.score + phase4Score + bonusPoints, timeSpent, isPerfect);
    } else {
      // Retirer les images incorrectes et permettre une nouvelle tentative
      const newUserSequence = userSequence.map((userImage, index) => {
        const isCorrectPosition = userImage?.id === correctInversedSequence[index].image.id;
        return isCorrectPosition ? userImage : null;
      });

      setGameState(prev => ({
        ...prev,
        userSequence: newUserSequence
      }));

      toast({
        title: `Tentative ${newAttempts}/3`,
        description: `${correctPositions} image(s) bien placée(s). Les images incorrectes ont été retirées.`,
        variant: "default"
      });
    }
  }, [gameState, toast]);

  const saveGameSession = useCallback(async (difficulty: DifficultyLevel, totalScore: number, completionTime?: number, completed: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionData = {
        user_id: user.id,
        difficulty_level: difficulty,
        score: gameState.score,
        bonus_points: gameState.bonusPoints,
        total_points: totalScore,
        completion_time: completionTime,
        questions_answered: gameState.questionsAnswered,
        questions_correct: gameState.correctAnswers,
        phase_4_attempts: gameState.phase4Attempts,
        phase_4_completed: completed
      };

      await supabase.from('visual_memory_game_sessions').insert(sessionData);

      // Mettre à jour le classement mensuel
      const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { data: existingEntry } = await supabase
        .from('visual_memory_leaderboards')
        .select('*')
        .eq('user_id', user.id)
        .eq('difficulty_level', difficulty)
        .eq('month_year', monthYear)
        .single();

      if (existingEntry) {
        // Mettre à jour si c'est un meilleur score
        if (totalScore > existingEntry.best_total_points) {
          await supabase
            .from('visual_memory_leaderboards')
            .update({
              best_score: Math.max(gameState.score, existingEntry.best_score),
              best_total_points: totalScore,
              games_played: existingEntry.games_played + 1
            })
            .eq('id', existingEntry.id);
        } else {
          // Juste incrémenter le nombre de parties
          await supabase
            .from('visual_memory_leaderboards')
            .update({
              games_played: existingEntry.games_played + 1
            })
            .eq('id', existingEntry.id);
        }
      } else {
        // Créer une nouvelle entrée
        await supabase.from('visual_memory_leaderboards').insert({
          user_id: user.id,
          difficulty_level: difficulty,
          best_score: gameState.score,
          best_total_points: totalScore,
          games_played: 1,
          month_year: monthYear
        });
      }

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }, [gameState.score, gameState.bonusPoints, gameState.questionsAnswered, gameState.correctAnswers, gameState.phase4Attempts]);

  const resetGame = useCallback(() => {
    setGameState({
      phase: 'setup',
      settings: initialSettings,
      imageSequence: [],
      currentQuestionIndex: 0,
      score: 0,
      phase1Score: 0,
      phase2Score: 0,
      phase3Score: 0,
      phase4Score: 0,
      bonusPoints: 0,
      questionsAsked: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      phase4Attempts: 0,
      phase4TimeLimit: 60,
      phase4StartTime: 0,
      phase4Images: [],
      userSequence: [],
      startTime: 0,
      endTime: 0
    });
    setQuestionResults([]);
  }, []);

  const getGameResult = useCallback((): GameResult => {
    const totalTime = gameState.endTime - gameState.startTime;
    const phase4Time = gameState.phase4StartTime > 0 ? gameState.endTime - gameState.phase4StartTime : undefined;
    
    return {
      difficulty: gameState.settings.difficulty,
      totalScore: gameState.score,
      phase1Score: gameState.phase1Score,
      phase2Score: gameState.phase2Score,
      phase3Score: gameState.phase3Score,
      phase4Score: gameState.phase4Score,
      bonusPoints: gameState.bonusPoints,
      totalQuestions: gameState.questionsAnswered,
      correctAnswers: gameState.correctAnswers,
      accuracy: gameState.questionsAnswered > 0 ? (gameState.correctAnswers / gameState.questionsAnswered) * 100 : 0,
      totalTime,
      phase4Time,
      questions: questionResults,
      completedPhase4: gameState.phase4Attempts > 0,
      phase4Attempts: gameState.phase4Attempts
    };
  }, [gameState, questionResults]);

  // Timer pour la phase 4
  const [phase4TimeLeft, setPhase4TimeLeft] = useState(60);

  useEffect(() => {
    if (gameState.phase === 'question4' && gameState.phase4StartTime > 0) {
      const interval = setInterval(() => {
        const timeElapsed = Math.floor((Date.now() - gameState.phase4StartTime) / 1000);
        const timeLeft = Math.max(0, 60 - timeElapsed);
        setPhase4TimeLeft(timeLeft);
        
        if (timeLeft === 0) {
          // Temps écoulé, terminer le jeu
          setGameState(prev => ({
            ...prev,
            phase: 'results',
            endTime: Date.now()
          }));
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameState.phase, gameState.phase4StartTime]);

  return {
    gameState,
    phase4TimeLeft,
    questionResults,
    updateSettings,
    startGame,
    finishDisplay,
    answerQuestion1,
    answerQuestion2,
    answerQuestion3,
    handlePhase4ImageClick,
    removePhase4Image,
    verifyPhase4,
    resetGame,
    getGameResult
  };
};