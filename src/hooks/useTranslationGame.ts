
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { GameWord, GameSession, GameMode } from '@/types/translationGame';

const TOTAL_QUESTIONS = 20;

export const useTranslationGame = () => {
  const [gameWords, setGameWords] = useState<GameWord[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<GameWord[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameHistory, setGameHistory] = useState<GameSession[]>([]);

  // Load words and game history on mount
  useEffect(() => {
    fetchWords();
    loadGameHistory();
  }, []);

  const fetchWords = async () => {
    try {
      console.log('🎮 Début du chargement des mots depuis Supabase...');
      
      const { data, error } = await supabase
        .from('game_franglais')
        .select('Francais, Anglais');

      console.log('🎮 Réponse Supabase:', { data, error });
      console.log('🎮 Nombre de mots récupérés:', data?.length || 0);

      if (error) {
        console.error('❌ Erreur lors du chargement des mots:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les mots du jeu",
          variant: "destructive",
        });
        return;
      }

      if (!data || data.length === 0) {
        console.error('❌ Aucune donnée récupérée');
        toast({
          title: "Erreur",
          description: "Aucun mot trouvé dans la base de données",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Mots chargés avec succès:', data.length);
      setGameWords(data);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des mots:', error);
      toast({
        title: "Erreur",
        description: "Erreur technique lors du chargement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGameHistory = () => {
    const history = localStorage.getItem('translation-game-history');
    if (history) {
      setGameHistory(JSON.parse(history));
    }
  };

  const saveGameSession = (finalScore: number) => {
    const newSession: GameSession = {
      score: finalScore,
      total: TOTAL_QUESTIONS,
      mode: gameMode!,
      date: new Date().toISOString(),
    };

    const updatedHistory = [newSession, ...gameHistory.slice(0, 4)];
    setGameHistory(updatedHistory);
    localStorage.setItem('translation-game-history', JSON.stringify(updatedHistory));
  };

  const startGame = (mode: 'fr-to-en' | 'en-to-fr') => {
    console.log('🎮 Tentative de démarrage du jeu...');
    console.log('🎮 Nombre de mots disponibles:', gameWords.length);
    console.log('🎮 Mots requis:', TOTAL_QUESTIONS);

    if (gameWords.length < TOTAL_QUESTIONS) {
      console.error('❌ Pas assez de mots pour jouer');
      toast({
        title: "Pas assez de mots",
        description: `Il faut au moins ${TOTAL_QUESTIONS} mots pour jouer. Actuellement: ${gameWords.length} mots`,
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Démarrage du jeu en mode:', mode);
    setGameMode(mode);
    setGameStarted(true);
    setScore(0);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
    setGameFinished(false);

    // Sélectionner 20 mots aléatoirement
    const shuffled = [...gameWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, TOTAL_QUESTIONS);
    console.log('🎮 Mots sélectionnés pour la partie:', selectedWords.length);
    setCurrentQuestions(selectedWords);
  };

  const getCurrentWord = () => {
    if (!currentQuestions[currentQuestionIndex]) return '';
    return gameMode === 'fr-to-en' 
      ? currentQuestions[currentQuestionIndex].Francais
      : currentQuestions[currentQuestionIndex].Anglais;
  };

  const getCorrectAnswer = () => {
    if (!currentQuestions[currentQuestionIndex]) return '';
    return gameMode === 'fr-to-en' 
      ? currentQuestions[currentQuestionIndex].Anglais
      : currentQuestions[currentQuestionIndex].Francais;
  };

  const checkAnswer = () => {
    const correctAnswer = getCorrectAnswer().toLowerCase().trim();
    const playerAnswer = userAnswer.toLowerCase().trim();
    const correct = correctAnswer === playerAnswer;
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 >= TOTAL_QUESTIONS) {
      // Jeu terminé
      setGameFinished(true);
      saveGameSession(score + (isCorrect ? 1 : 0));
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setShowResult(false);
      setIsCorrect(null);
    }
  };

  const resetGame = () => {
    setGameMode(null);
    setGameStarted(false);
    setGameFinished(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
  };

  return {
    gameWords,
    currentQuestionIndex,
    gameMode,
    userAnswer,
    score,
    gameStarted,
    gameFinished,
    showResult,
    isCorrect,
    loading,
    gameHistory,
    TOTAL_QUESTIONS,
    setUserAnswer,
    startGame,
    getCurrentWord,
    getCorrectAnswer,
    checkAnswer,
    nextQuestion,
    resetGame,
  };
};
