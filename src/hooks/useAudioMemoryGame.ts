import { useState, useCallback, useEffect } from 'react';
import { GameState, GameSettings, GameResult, DifficultyLevel, GamePhase, QuestionResult } from '@/types/audioMemoryGame';
import { getDifficultySoundCount } from '@/data/audioMemoryData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserActionsService } from '@/services/UserActionsService';
import { useAudioMemoryGameEngine } from './useAudioMemoryGameEngine';

const initialSettings: GameSettings = {
  difficulty: 'beginner',
  numberOfSounds: 4
};

export const useAudioMemoryGame = () => {
  const { toast } = useToast();
  const { generateSoundSequence, generatePhase4Sounds, hasSounds, isLoading } = useAudioMemoryGameEngine();
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    settings: initialSettings,
    soundSequence: [],
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
    phase4TimeLeft: 60,
    phase4Sounds: [],
    userSequence: [],
    startTime: 0,
    endTime: 0,
    currentSequenceRepetition: 0
  });

  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [phase4TimeLeft, setPhase4TimeLeft] = useState(60);

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setGameState(prev => ({
      ...prev,
      settings: { 
        ...prev.settings, 
        ...newSettings,
        numberOfSounds: getDifficultySoundCount(newSettings.difficulty || prev.settings.difficulty)
      }
    }));
  }, []);

  const startGame = useCallback(() => {
    UserActionsService.trackView('activity', 'audio_memory_game', `Difficulté: ${gameState.settings.difficulty}`);
    
    console.log('🎮 Starting game with difficulty:', gameState.settings.difficulty);
    
    if (!hasSounds) {
      console.error('❌ Cannot start game: No sounds available in database');
      toast({
        title: "Impossible de démarrer le jeu",
        description: "Aucun son n'est disponible. Veuillez contacter l'administrateur.",
        variant: "destructive",
      });
      return;
    }
    
    const soundSequence = generateSoundSequence(gameState.settings.difficulty);
    const phase4Sounds = generatePhase4Sounds(soundSequence);
    
    console.log('🎵 Generated sequences:', {
      soundSequence: soundSequence.length,
      phase4Sounds: phase4Sounds.length
    });
    
    setGameState(prev => ({
      ...prev,
      phase: 'display',
      soundSequence,
      phase4Sounds,
      userSequence: new Array(soundSequence.length).fill(null),
      startTime: Date.now(),
      currentSequenceRepetition: 1,
      score: 0,
      phase1Score: 0,
      phase2Score: 0,
      phase3Score: 0,
      phase4Score: 0,
      bonusPoints: 0,
      questionsAsked: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      phase4Attempts: 0
    }));
    
    setQuestionResults([]);
  }, [gameState.settings, generateSoundSequence, generatePhase4Sounds, hasSounds, toast]);

  const finishDisplay = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'question1'
    }));
  }, []);

  const answerQuestion1 = useCallback((soundId: string, answer: boolean) => {
    const currentSound = gameState.soundSequence.find(s => s.sound.id === soundId);
    const wasInSequence = !!currentSound;
    const isCorrect = answer === wasInSequence;
    const points = isCorrect ? 1 : 0;

    const questionResult: QuestionResult = {
      questionType: 'difficulty1',
      soundShown: gameState.soundSequence[gameState.currentQuestionIndex]?.sound || gameState.soundSequence[0].sound,
      correctAnswer: wasInSequence,
      userAnswer: answer,
      isCorrect,
      points,
      timeSpent: 0
    };

    setQuestionResults(prev => [...prev, questionResult]);
    
    setGameState(prev => ({
      ...prev,
      phase1Score: prev.phase1Score + points,
      score: prev.score + points,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      phase: 'question2'
    }));

    if (!isCorrect) {
      toast({
        title: "Réponse incorrecte",
        description: wasInSequence ? "Ce son était bien dans la séquence" : "Ce son n'était pas dans la séquence",
        variant: "destructive"
      });
    }
  }, [gameState, toast]);

  const answerQuestion2 = useCallback((soundId: string, answer: boolean) => {
    const currentSound = gameState.soundSequence.find(s => s.sound.id === soundId);
    const wasInSequence = !!currentSound;
    const isCorrect = answer === wasInSequence;
    const points = isCorrect ? 2 : 0;

    const questionResult: QuestionResult = {
      questionType: 'difficulty2',
      soundShown: gameState.soundSequence[gameState.currentQuestionIndex]?.sound || gameState.soundSequence[0].sound,
      correctAnswer: wasInSequence,
      userAnswer: answer,
      isCorrect,
      points,
      timeSpent: 0
    };

    setQuestionResults(prev => [...prev, questionResult]);
    
    setGameState(prev => ({
      ...prev,
      phase2Score: prev.phase2Score + points,
      score: prev.score + points,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      phase: 'question3'
    }));

    if (!isCorrect) {
      toast({
        title: "Réponse incorrecte",
        description: "Attention aux sons similaires mais différents !",
        variant: "destructive"
      });
    }
  }, [gameState, toast]);

  const answerQuestion3 = useCallback((soundId: string, position: number) => {
    const soundInSequence = gameState.soundSequence.find(s => s.sound.id === soundId);
    const correctPosition = soundInSequence ? soundInSequence.position + 1 : -1; // +1 car affichage commence à 1
    const isCorrect = position === correctPosition;
    const points = isCorrect ? 3 : 0;

    const questionResult: QuestionResult = {
      questionType: 'difficulty3',
      soundShown: soundInSequence?.sound || gameState.soundSequence[0].sound,
      correctAnswer: correctPosition,
      userAnswer: position,
      isCorrect,
      points,
      timeSpent: 0
    };

    setQuestionResults(prev => [...prev, questionResult]);
    
    setGameState(prev => ({
      ...prev,
      phase3Score: prev.phase3Score + points,
      score: prev.score + points,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      phase: 'question4',
      phase4StartTime: Date.now()
    }));

    if (!isCorrect) {
      toast({
        title: "Position incorrecte",
        description: `Ce son était en position ${correctPosition}`,
        variant: "destructive"
      });
    }
  }, [gameState, toast]);

  const handlePhase4SoundClick = useCallback((soundIndex: number) => {
    const sound = gameState.phase4Sounds[soundIndex];
    if (!sound) return;

    // Trouver la première position libre dans la séquence
    const emptyIndex = gameState.userSequence.findIndex(slot => slot === null);
    if (emptyIndex === -1) return; // Pas de place libre

    setGameState(prev => ({
      ...prev,
      userSequence: prev.userSequence.map((slot, index) => 
        index === emptyIndex ? sound : slot
      )
    }));
  }, [gameState]);

  const removePhase4Sound = useCallback((index: number) => {
    setGameState(prev => ({
      ...prev,
      userSequence: prev.userSequence.map((sound, i) => 
        i === index ? null : sound
      )
    }));
  }, []);

  const verifyPhase4 = useCallback(() => {
    const { userSequence, soundSequence, phase4Attempts } = gameState;
    const reversedOriginalSequence = [...soundSequence].reverse();
    
    let correctSounds = 0;
    let correctPositions = 0;
    
    // Vérifier chaque position
    userSequence.forEach((userSound, index) => {
      if (userSound) {
        // Le son est-il dans la séquence originale ?
        const wasInOriginal = soundSequence.some(s => s.sound.id === userSound.id);
        if (wasInOriginal) {
          correctSounds++;
          
          // Est-il à la bonne position dans l'ordre inversé ?
          const expectedSound = reversedOriginalSequence[index];
          if (expectedSound && expectedSound.sound.id === userSound.id) {
            correctPositions++;
          }
        }
      }
    });

    const phase4Score = correctSounds + correctPositions;
    let bonusPoints = 0;
    let completedPhase4 = false;

    // Vérifier si la séquence est parfaite
    if (correctPositions === soundSequence.length && correctSounds === soundSequence.length) {
      bonusPoints = 15;
      completedPhase4 = true;
      
      // Bonus temporel
      const timeSpent = Math.floor((Date.now() - gameState.phase4StartTime) / 1000);
      if (timeSpent <= 60) {
        bonusPoints += (60 - timeSpent);
      }
    }

    const newAttempts = phase4Attempts + 1;
    const isLastAttempt = newAttempts >= 3;

    setGameState(prev => ({
      ...prev,
      phase4Score: prev.phase4Score + phase4Score,
      bonusPoints: prev.bonusPoints + bonusPoints,
      score: prev.score + phase4Score + bonusPoints,
      phase4Attempts: newAttempts,
      phase: isLastAttempt || completedPhase4 ? 'results' : prev.phase,
      endTime: isLastAttempt || completedPhase4 ? Date.now() : prev.endTime
    }));

    if (!completedPhase4 && !isLastAttempt) {
      // Retirer les sons mal placés
      const newUserSequence = userSequence.map((userSound, index) => {
        if (!userSound) return null;
        
        const wasInOriginal = soundSequence.some(s => s.sound.id === userSound.id);
        const expectedSound = reversedOriginalSequence[index];
        const isCorrectPosition = expectedSound && expectedSound.sound.id === userSound.id;
        
        return (wasInOriginal && isCorrectPosition) ? userSound : null;
      });

      setGameState(prev => ({
        ...prev,
        userSequence: newUserSequence
      }));

      toast({
        title: `Tentative ${newAttempts}/3`,
        description: `${correctSounds} bons sons, ${correctPositions} bien placés`,
        variant: "destructive"
      });
    } else if (completedPhase4) {
      toast({
        title: "Excellent !",
        description: `Séquence parfaite ! Bonus: ${bonusPoints} points`,
      });
    }
  }, [gameState, toast]);

  // Timer pour la phase 4
  useEffect(() => {
    if (gameState.phase === 'question4' && gameState.phase4StartTime > 0) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.phase4StartTime) / 1000);
        const timeLeft = Math.max(0, 60 - elapsed);
        
        setPhase4TimeLeft(timeLeft);
        
        if (timeLeft === 0) {
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

  const saveGameSession = useCallback(async () => {
    if (!supabase.auth.getUser) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const gameResult = getGameResult();
      
      // Sauvegarder la session
      const { error: sessionError } = await supabase
        .from('audio_memory_game_sessions')
        .insert({
          user_id: user.id,
          difficulty: gameResult.difficulty,
          score: gameResult.totalScore,
          phase1_score: gameResult.phase1Score,
          phase2_score: gameResult.phase2Score,
          phase3_score: gameResult.phase3Score,
          phase4_score: gameResult.phase4Score,
          bonus_points: gameResult.bonusPoints,
          total_points: gameResult.totalScore,
          questions_answered: gameResult.totalQuestions,
          questions_correct: gameResult.correctAnswers,
          phase4_attempts: gameResult.phase4Attempts,
          phase4_completed: gameResult.completedPhase4,
          completion_time: gameResult.phase4Time,
          sounds_used: gameState.soundSequence.map(s => s.sound.id),
          session_data: JSON.stringify({
            questions: questionResults,
            totalTime: gameResult.totalTime
          })
        });

      if (sessionError) throw sessionError;

      // Mettre à jour le classement mensuel
      const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { data: existingEntry } = await supabase
        .from('audio_memory_leaderboards')
        .select('*')
        .eq('user_id', user.id)
        .eq('difficulty', gameResult.difficulty)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (existingEntry) {
        // Mettre à jour si meilleur score
        if (gameResult.totalScore > existingEntry.best_total_points) {
          await supabase
            .from('audio_memory_leaderboards')
            .update({
              best_score: gameResult.totalScore,
              best_total_points: gameResult.totalScore,
              games_played: existingEntry.games_played + 1
            })
            .eq('id', existingEntry.id);
        } else {
          await supabase
            .from('audio_memory_leaderboards')
            .update({
              games_played: existingEntry.games_played + 1
            })
            .eq('id', existingEntry.id);
        }
      } else {
        // Créer nouvelle entrée
        await supabase
          .from('audio_memory_leaderboards')
          .insert({
            user_id: user.id,
            difficulty: gameResult.difficulty,
            month_year: monthYear,
            best_score: gameResult.totalScore,
            best_total_points: gameResult.totalScore,
            games_played: 1
          });
      }

      UserActionsService.trackView('activity', 'audio_memory_game', 
        `Score: ${gameResult.totalScore}, Difficulté: ${gameResult.difficulty}`);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder votre partie",
        variant: "destructive"
      });
    }
  }, [gameState, questionResults, toast]);

  const resetGame = useCallback(() => {
    setGameState({
      phase: 'setup',
      settings: initialSettings,
      soundSequence: [],
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
      phase4TimeLeft: 60,
      phase4Sounds: [],
      userSequence: [],
      startTime: 0,
      endTime: 0,
      currentSequenceRepetition: 0
    });
    setQuestionResults([]);
    setPhase4TimeLeft(60);
  }, []);

  const getGameResult = useCallback((): GameResult => {
    const totalTime = gameState.endTime - gameState.startTime;
    const phase4Time = gameState.phase4StartTime > 0 ? 
      (gameState.endTime - gameState.phase4StartTime) / 1000 : undefined;

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
      accuracy: gameState.questionsAnswered > 0 ? 
        (gameState.correctAnswers / gameState.questionsAnswered) * 100 : 0,
      totalTime,
      phase4Time,
      questions: questionResults,
      completedPhase4: gameState.bonusPoints >= 15,
      phase4Attempts: gameState.phase4Attempts
    };
  }, [gameState, questionResults]);

  // Sauvegarder automatiquement quand le jeu se termine
  useEffect(() => {
    if (gameState.phase === 'results' && gameState.endTime > 0) {
      saveGameSession();
    }
  }, [gameState.phase, gameState.endTime, saveGameSession]);

  return {
    gameState,
    questionResults,
    phase4TimeLeft,
    updateSettings,
    startGame,
    finishDisplay,
    answerQuestion1,
    answerQuestion2,
    answerQuestion3,
    handlePhase4SoundClick,
    removePhase4Sound,
    verifyPhase4,
    resetGame,
    getGameResult
  };
};