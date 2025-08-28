import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  EmotionImage, 
  EmotionGameQuestion, 
  EmotionGameSession, 
  EmotionLeaderboard,
  GamePhase,
  GameStats 
} from '@/types/emotionGame';

export const useEmotionGame = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [questions, setQuestions] = useState<EmotionGameQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allEmotionLabels, setAllEmotionLabels] = useState<string[]>([]);
  const [shuffledLabels, setShuffledLabels] = useState<string[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [selectedIntensity, setSelectedIntensity] = useState<string>('');
  const [showIntensityQuestion, setShowIntensityQuestion] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    emotionCorrect: 0,
    intensityCorrect: 0,
    totalScore: 0,
    completionTime: 0
  });
  const [startTime, setStartTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<EmotionLeaderboard[]>([]);

  // Fetch all emotion images
  const fetchEmotionImages = useCallback(async (): Promise<EmotionImage[]> => {
    const { data, error } = await supabase
      .from('emotion_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching emotion images:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les images d'émotions",
        variant: "destructive"
      });
      return [];
    }

    return data || [];
  }, [toast]);

  // Initialize game
  const initializeGame = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const images = await fetchEmotionImages();
      
      if (images.length < 24) {
        toast({
          title: "Images insuffisantes",
          description: `Il faut au moins 24 images pour jouer. Actuellement: ${images.length}`,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Select 24 random images
      const shuffledImages = [...images].sort(() => 0.5 - Math.random());
      const selectedImages = shuffledImages.slice(0, 24);
      
      // Create questions
      const gameQuestions: EmotionGameQuestion[] = selectedImages.map((image, index) => ({
        image,
        position: index
      }));

      // Get all emotion labels and shuffle them
      const emotionLabels = images.map(img => img.emotion_name);
      const uniqueLabels = [...new Set(emotionLabels)];
      const shuffled = [...uniqueLabels].sort(() => 0.5 - Math.random());

      setQuestions(gameQuestions);
      setAllEmotionLabels(uniqueLabels);
      setShuffledLabels(shuffled);
      setCurrentQuestionIndex(0);
      setSelectedEmotion('');
      setSelectedIntensity('');
      setShowIntensityQuestion(false);
      setGameStats({
        emotionCorrect: 0,
        intensityCorrect: 0,
        totalScore: 0,
        completionTime: 0
      });
      
      console.log('🎮 Game initialized with', gameQuestions.length, 'questions');
      
    } catch (error) {
      console.error('Error initializing game:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'initialiser le jeu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchEmotionImages, toast]);

  // Start game
  const startGame = useCallback(() => {
    setGamePhase('playing');
    setStartTime(Date.now());
    console.log('🎮 Game started');
  }, []);

  // Handle emotion selection
  const handleEmotionSelect = useCallback((emotion: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setSelectedEmotion(emotion);
    const isCorrect = emotion === currentQuestion.image.emotion_name;
    
    if (isCorrect) {
      setGameStats(prev => ({
        ...prev,
        emotionCorrect: prev.emotionCorrect + 1,
        totalScore: prev.totalScore + 2
      }));
      setShowIntensityQuestion(true);
      console.log('✅ Correct emotion selected:', emotion);
    } else {
      console.log('❌ Wrong emotion selected:', emotion, 'correct was:', currentQuestion.image.emotion_name);
      moveToNextQuestion();
    }
  }, [questions, currentQuestionIndex]);

  // Handle intensity selection
  const handleIntensitySelect = useCallback((intensity: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setSelectedIntensity(intensity);
    const isCorrect = intensity === currentQuestion.image.intensity;
    
    if (isCorrect) {
      setGameStats(prev => ({
        ...prev,
        intensityCorrect: prev.intensityCorrect + 1,
        totalScore: prev.totalScore + 1
      }));
      console.log('✅ Correct intensity selected:', intensity);
    } else {
      console.log('❌ Wrong intensity selected:', intensity, 'correct was:', currentQuestion.image.intensity);
    }
    
    moveToNextQuestion();
  }, [questions, currentQuestionIndex]);

  // Move to next question
  const moveToNextQuestion = useCallback(() => {
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedEmotion('');
        setSelectedIntensity('');
        setShowIntensityQuestion(false);
      } else {
        // Game finished
        const completionTime = Math.floor((Date.now() - startTime) / 1000);
        setGameStats(prev => ({ ...prev, completionTime }));
        setGamePhase('results');
        console.log('🎮 Game finished');
      }
    }, 1500);
  }, [currentQuestionIndex, questions.length, startTime]);

  // Save game session
  const saveGameSession = useCallback(async (stats: GameStats) => {
    if (!user) return;

    try {
      const sessionData: EmotionGameSession = {
        user_id: user.id,
        score: stats.totalScore,
        emotion_correct: stats.emotionCorrect,
        intensity_correct: stats.intensityCorrect,
        total_questions: 24,
        completion_time: stats.completionTime,
        session_data: {
          questions: questions.length,
          timestamp: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('emotion_game_sessions')
        .insert(sessionData);

      if (error) {
        console.error('Error saving game session:', error);
        return;
      }

      // Update leaderboard
      await updateLeaderboard(stats.totalScore);
      
      console.log('✅ Game session saved');
      
    } catch (error) {
      console.error('Error saving game session:', error);
    }
  }, [user, questions.length]);

  // Update leaderboard
  const updateLeaderboard = useCallback(async (newScore: number) => {
    if (!user) return;

    try {
      const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { data: existing } = await supabase
        .from('emotion_leaderboards')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .single();

      if (existing) {
        // Update existing record
        const updatedData = {
          games_played: existing.games_played + 1,
          best_score: Math.max(existing.best_score, newScore),
          best_total_points: Math.max(existing.best_total_points, newScore)
        };

        await supabase
          .from('emotion_leaderboards')
          .update(updatedData)
          .eq('id', existing.id);
      } else {
        // Create new record
        await supabase
          .from('emotion_leaderboards')
          .insert({
            user_id: user.id,
            best_score: newScore,
            best_total_points: newScore,
            games_played: 1,
            month_year: monthYear
          });
      }
      
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }, [user]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_emotion_leaderboard');
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }
      
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    setGamePhase('setup');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedEmotion('');
    setSelectedIntensity('');
    setShowIntensityQuestion(false);
    setGameStats({
      emotionCorrect: 0,
      intensityCorrect: 0,
      totalScore: 0,
      completionTime: 0
    });
  }, []);

  // Load leaderboard on mount
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Save session when game ends
  useEffect(() => {
    if (gamePhase === 'results' && gameStats.completionTime > 0) {
      saveGameSession(gameStats);
    }
  }, [gamePhase, gameStats, saveGameSession]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return {
    // State
    gamePhase,
    currentQuestion,
    currentQuestionIndex,
    shuffledLabels,
    selectedEmotion,
    selectedIntensity,
    showIntensityQuestion,
    gameStats,
    isLoading,
    leaderboard,
    progress,
    totalQuestions: questions.length,

    // Actions
    initializeGame,
    startGame,
    handleEmotionSelect,
    handleIntensitySelect,
    resetGame,
    fetchLeaderboard
  };
};