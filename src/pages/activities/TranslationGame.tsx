
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RotateCcw, Trophy, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GameWord {
  Francais: string;
  Anglais: string;
}

interface GameSession {
  score: number;
  total: number;
  mode: 'fr-to-en' | 'en-to-fr';
  date: string;
}

const TranslationGame = () => {
  const [gameWords, setGameWords] = useState<GameWord[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<GameWord[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameMode, setGameMode] = useState<'fr-to-en' | 'en-to-fr' | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameHistory, setGameHistory] = useState<GameSession[]>([]);

  const TOTAL_QUESTIONS = 20;

  // Charger les mots depuis Supabase
  useEffect(() => {
    fetchWords();
    loadGameHistory();
  }, []);

  const fetchWords = async () => {
    try {
      const { data, error } = await supabase
        .from('game_franglais')
        .select('Francais, Anglais');

      if (error) {
        console.error('Erreur lors du chargement des mots:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les mots du jeu",
          variant: "destructive",
        });
        return;
      }

      setGameWords(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des mots:', error);
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
    if (gameWords.length < TOTAL_QUESTIONS) {
      toast({
        title: "Pas assez de mots",
        description: `Il faut au moins ${TOTAL_QUESTIONS} mots pour jouer`,
        variant: "destructive",
      });
      return;
    }

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
    setCurrentQuestions(shuffled.slice(0, TOTAL_QUESTIONS));
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-lg text-gray-600">Chargement du jeu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/activities" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour aux activités</span>
          </Link>
          
          {gameStarted && !gameFinished && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} / {TOTAL_QUESTIONS}
              </div>
              <div className="text-sm font-semibold text-blue-600">
                Score: {score} / {TOTAL_QUESTIONS}
              </div>
            </div>
          )}
        </div>

        {/* Écran de sélection du mode */}
        {!gameStarted && !gameFinished && (
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                🇫🇷 ↔️ 🇬🇧 Jeu de Traduction
              </h1>
              <p className="text-lg text-gray-600">
                Traduisez {TOTAL_QUESTIONS} mots et testez vos connaissances !
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => startGame('fr-to-en')}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">🇫🇷 ➡️ 🇬🇧</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-lg font-semibold mb-2">Français vers Anglais</p>
                  <p className="text-gray-600">Traduisez les mots français en anglais</p>
                  <Button className="mt-4 w-full bg-blue-500 hover:bg-blue-600">
                    Commencer
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => startGame('en-to-fr')}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">🇬🇧 ➡️ 🇫🇷</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-lg font-semibold mb-2">Anglais vers Français</p>
                  <p className="text-gray-600">Traduisez les mots anglais en français</p>
                  <Button className="mt-4 w-full bg-purple-500 hover:bg-purple-600">
                    Commencer
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Historique des parties */}
            {gameHistory.length > 0 && (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Historique des parties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gameHistory.map((session, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {session.mode === 'fr-to-en' ? '🇫🇷➡️🇬🇧' : '🇬🇧➡️🇫🇷'}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatDate(session.date)}
                          </span>
                        </div>
                        <div className="font-semibold">
                          {session.score}/{session.total}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Jeu en cours */}
        {gameStarted && !gameFinished && (
          <div className="max-w-2xl mx-auto">
            <Card className="mb-6">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {gameMode === 'fr-to-en' ? '🇫🇷 ➡️ 🇬🇧' : '🇬🇧 ➡️ 🇫🇷'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <p className="text-lg text-gray-600 mb-2">
                    {gameMode === 'fr-to-en' ? 'Traduisez en anglais :' : 'Traduisez en français :'}
                  </p>
                  <p className="text-4xl font-bold text-blue-600 mb-6">
                    {getCurrentWord()}
                  </p>
                </div>

                {!showResult ? (
                  <div className="space-y-4">
                    <Input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Votre réponse..."
                      className="text-lg text-center"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && userAnswer.trim()) {
                          checkAnswer();
                        }
                      }}
                      autoFocus
                    />
                    <Button 
                      onClick={checkAnswer}
                      disabled={!userAnswer.trim()}
                      className="w-full"
                    >
                      Valider
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`text-6xl ${isCorrect ? 'animate-bounce' : ''}`}>
                      {isCorrect ? '😊' : '😞'}
                    </div>
                    <div className="text-xl font-semibold">
                      {isCorrect ? (
                        <span className="text-green-600">Correct ! 🎉</span>
                      ) : (
                        <div>
                          <span className="text-red-600">Incorrect</span>
                          <p className="text-gray-600 mt-2">
                            La bonne réponse était : <strong>{getCorrectAnswer()}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                    <Button onClick={nextQuestion} className="w-full">
                      {currentQuestionIndex + 1 >= TOTAL_QUESTIONS ? 'Voir les résultats' : 'Question suivante'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Résultats finaux */}
        {gameFinished && (
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">
                  {score >= 16 ? '🏆' : score >= 12 ? '🥈' : score >= 8 ? '🥉' : '💪'} 
                  Jeu terminé !
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl mb-4">
                  {score >= 16 ? '🎉' : score >= 12 ? '😊' : score >= 8 ? '🙂' : '😐'}
                </div>
                <p className="text-2xl font-bold mb-4">
                  Score final : {score} / {TOTAL_QUESTIONS}
                </p>
                <p className="text-lg text-gray-600 mb-6">
                  {score >= 16 ? 'Excellent ! Vous maîtrisez parfaitement !' :
                   score >= 12 ? 'Très bien ! Continuez comme ça !' :
                   score >= 8 ? 'Pas mal ! Encore quelques efforts !' :
                   'Continuez à vous entraîner !'}
                </p>
                <div className="space-y-3">
                  <Button onClick={resetGame} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Rejouer
                  </Button>
                  <Link to="/activities">
                    <Button variant="outline" className="w-full">
                      Retour aux activités
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationGame;
