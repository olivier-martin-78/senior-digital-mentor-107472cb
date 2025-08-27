import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { GameState, GameSound, QuestionResult, GameSession, LeaderboardEntry } from '@/types/bigNoiseGame';
import { useAudioMemoryDB } from './useAudioMemoryDB';

const TOTAL_SOUNDS = 20;
const SOUND_DURATION = 3000; // 3 seconds

export const useBigNoiseGame = () => {
  const { user } = useAuth();
  const { sounds: allSounds, isLoading: soundsLoading } = useAudioMemoryDB();
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    currentSoundIndex: 0,
    sounds: [],
    questionResults: [],
    score: 0,
    exactMatches: 0,
    labelMatches: 0,
    consecutiveCorrect: 0,
    maxConsecutive: 0,
    showLabels: false,
    userInput: '',
    audioProgress: 0,
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Load leaderboard
  const loadLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_big_noise_leaderboard');
      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Erreur lors du chargement du classement');
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Generate random sounds for game
  const generateGameSounds = useCallback((): GameSound[] => {
    if (allSounds.length < TOTAL_SOUNDS) {
      toast.error(`Au moins ${TOTAL_SOUNDS} sons sont nécessaires pour jouer`);
      return [];
    }
    
    const originalSounds = allSounds.filter(sound => sound.type === 'original');
    const shuffled = [...originalSounds].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, TOTAL_SOUNDS);
  }, [allSounds]);

  // Start new game
  const startGame = useCallback(() => {
    const gameSounds = generateGameSounds();
    if (gameSounds.length === 0) return;

    setGameState({
      phase: 'playing',
      currentSoundIndex: 0,
      sounds: gameSounds,
      questionResults: [],
      score: 0,
      exactMatches: 0,
      labelMatches: 0,
      consecutiveCorrect: 0,
      maxConsecutive: 0,
      startTime: Date.now(),
      showLabels: false,
      currentSound: gameSounds[0],
      userInput: '',
      audioProgress: 0,
    });
  }, [generateGameSounds]);

  // Play current sound
  const playCurrentSound = useCallback(() => {
    if (!gameState.currentSound?.file_url) return;

    // Stop previous audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new HTMLAudioElement();
    audio.src = gameState.currentSound.file_url;
    setCurrentAudio(audio);

    // Progress tracking
    let progressInterval: NodeJS.Timeout;
    
    const updateProgress = () => {
      const progress = (audio.currentTime / SOUND_DURATION) * 100;
      setGameState(prev => ({ ...prev, audioProgress: Math.min(progress, 100) }));
    };

    audio.addEventListener('loadeddata', () => {
      audio.play();
      progressInterval = setInterval(updateProgress, 100);
    });

    audio.addEventListener('ended', () => {
      clearInterval(progressInterval);
      setGameState(prev => ({ ...prev, audioProgress: 100, phase: 'input' }));
    });

    // Force stop after 3 seconds
    setTimeout(() => {
      if (!audio.paused) {
        audio.pause();
        clearInterval(progressInterval);
        setGameState(prev => ({ ...prev, audioProgress: 100, phase: 'input' }));
      }
    }, SOUND_DURATION);
  }, [gameState.currentSound, currentAudio]);

  // Submit user input
  const submitUserInput = useCallback((input: string) => {
    const trimmedInput = input.trim().toLowerCase();
    if (!trimmedInput) return;

    const currentSound = gameState.currentSound!;
    const soundName = currentSound.name.toLowerCase();
    
    // Check for exact match (compare with words in the sound name)
    const soundWords = soundName.split(/[\s,.-]+/).filter(word => word.length > 2);
    const isExact = soundWords.some(word => 
      word.includes(trimmedInput) || trimmedInput.includes(word)
    );

    if (isExact) {
      // Exact match - 2 points
      const result: QuestionResult = {
        soundId: currentSound.id,
        soundName: currentSound.name,
        userInput: input,
        isCorrect: true,
        points: 2,
        type: 'exact'
      };

      setGameState(prev => ({
        ...prev,
        questionResults: [...prev.questionResults, result],
        score: prev.score + 2,
        exactMatches: prev.exactMatches + 1,
        consecutiveCorrect: prev.consecutiveCorrect + 1,
        maxConsecutive: Math.max(prev.maxConsecutive, prev.consecutiveCorrect + 1),
        userInput: '',
      }));

      moveToNextSound();
    } else {
      // Show labels for selection
      setGameState(prev => ({
        ...prev,
        phase: 'selection',
        userInput: input,
        showLabels: true,
      }));
    }
  }, [gameState.currentSound]);

  // Select label
  const selectLabel = useCallback((selectedSound: GameSound) => {
    const currentSound = gameState.currentSound!;
    const isCorrect = selectedSound.id === currentSound.id;
    const points = isCorrect ? 0.5 : 0;

    const result: QuestionResult = {
      soundId: currentSound.id,
      soundName: currentSound.name,
      userInput: gameState.userInput,
      selectedLabel: selectedSound.name,
      isCorrect,
      points,
      type: isCorrect ? 'label' : 'incorrect'
    };

    setGameState(prev => ({
      ...prev,
      questionResults: [...prev.questionResults, result],
      score: prev.score + points,
      labelMatches: isCorrect ? prev.labelMatches + 1 : prev.labelMatches,
      consecutiveCorrect: isCorrect ? prev.consecutiveCorrect + 1 : 0,
      maxConsecutive: Math.max(prev.maxConsecutive, isCorrect ? prev.consecutiveCorrect + 1 : prev.consecutiveCorrect),
      showLabels: false,
      userInput: '',
    }));

    moveToNextSound();
  }, [gameState.currentSound, gameState.userInput]);

  // Move to next sound
  const moveToNextSound = useCallback(() => {
    const nextIndex = gameState.currentSoundIndex + 1;
    
    if (nextIndex >= TOTAL_SOUNDS) {
      // Game finished
      finishGame();
    } else {
      setGameState(prev => ({
        ...prev,
        currentSoundIndex: nextIndex,
        currentSound: prev.sounds[nextIndex],
        phase: 'playing',
        audioProgress: 0,
      }));
    }
  }, [gameState.currentSoundIndex]);

  // Finish game
  const finishGame = useCallback(async () => {
    if (!user) return;

    const endTime = Date.now();
    const completionTime = gameState.startTime ? Math.round((endTime - gameState.startTime) / 1000) : 0;
    
    // Calculate consecutive bonus
    const consecutiveBonus = gameState.maxConsecutive * 5;
    const finalScore = gameState.score + consecutiveBonus;

    setGameState(prev => ({
      ...prev,
      phase: 'results',
      endTime,
      score: finalScore,
    }));

    // Save session
    try {
      setIsLoading(true);
      
      const sessionData = {
        user_id: user.id,
        score: finalScore,
        total_sounds: TOTAL_SOUNDS,
        correct_answers: gameState.exactMatches + gameState.labelMatches,
        exact_matches: gameState.exactMatches,
        label_matches: gameState.labelMatches,
        consecutive_bonus: consecutiveBonus,
        max_consecutive: gameState.maxConsecutive,
        sounds_used: JSON.stringify(gameState.sounds.map(s => s.id)),
        session_data: JSON.stringify(gameState.questionResults),
        completion_time: completionTime,
      };

      const { error: sessionError } = await supabase
        .from('big_noise_game_sessions')
        .insert(sessionData);

      if (sessionError) throw sessionError;

      // Update leaderboard
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
      
      const { data: existingEntry } = await supabase
        .from('big_noise_leaderboards')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth)
        .single();

      const leaderboardData = {
        user_id: user.id,
        month_year: currentMonth,
        best_score: Math.max(existingEntry?.best_score || 0, finalScore),
        best_total_points: Math.max(existingEntry?.best_total_points || 0, finalScore),
        games_played: (existingEntry?.games_played || 0) + 1,
      };

      if (existingEntry) {
        const { error: updateError } = await supabase
          .from('big_noise_leaderboards')
          .update(leaderboardData)
          .eq('id', existingEntry.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('big_noise_leaderboards')
          .insert(leaderboardData);
        
        if (insertError) throw insertError;
      }

      await loadLeaderboard();
      toast.success('Score enregistré !');
      
    } catch (error) {
      console.error('Error saving game session:', error);
      toast.error('Erreur lors de l\'enregistrement du score');
    } finally {
      setIsLoading(false);
    }
  }, [user, gameState, loadLeaderboard]);

  // Reset game
  const resetGame = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    
    setGameState({
      phase: 'setup',
      currentSoundIndex: 0,
      sounds: [],
      questionResults: [],
      score: 0,
      exactMatches: 0,
      labelMatches: 0,
      consecutiveCorrect: 0,
      maxConsecutive: 0,
      showLabels: false,
      userInput: '',
      audioProgress: 0,
    });
  }, [currentAudio]);

  return {
    gameState,
    leaderboard,
    isLoading: isLoading || soundsLoading,
    hasSounds: allSounds.length >= TOTAL_SOUNDS,
    soundsCount: allSounds.length,
    startGame,
    playCurrentSound,
    submitUserInput,
    selectLabel,
    resetGame,
    setUserInput: (input: string) => setGameState(prev => ({ ...prev, userInput: input })),
  };
};