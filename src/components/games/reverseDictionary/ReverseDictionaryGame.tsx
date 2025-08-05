import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Target, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserActionsService } from '@/services/UserActionsService';
import { ReverseDictionaryWord, ReverseDictionaryGameSession } from '@/types/reverseDictionary';

interface ReverseDictionaryGameProps {
  title: string;
  timerDuration: number;
  words: ReverseDictionaryWord[];
}

const ReverseDictionaryGame: React.FC<ReverseDictionaryGameProps> = ({
  title,
  timerDuration,
  words
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [gamePhase, setGamePhase] = useState<'playing' | 'result' | 'finished'>('playing');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const { toast } = useToast();

  const currentWord = words[currentWordIndex];
  const progress = ((currentWordIndex) / words.length) * 100;

  // Timer effect
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && timerActive) {
      handleTimeUp();
    }
  }, [timeLeft, timerActive]);

  const startGame = () => {
    setGameStarted(true);
    setTimerActive(true);
    UserActionsService.trackView('activity', 'reverse-dictionary-started', title, {
      action: 'game_started',
      wordsCount: words.length,
      timerDuration
    });
  };

  const handleTimeUp = () => {
    setTimerActive(false);
    setGamePhase('result');
    setIsCorrect(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    setTimerActive(false);
    const correct = userAnswer.trim().toLowerCase() === currentWord.word.toLowerCase();
    setIsCorrect(correct);
    
    if (correct) {
      setScore(score + 1);
    }
    
    setGamePhase('result');
  };

  const handleContinue = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setUserAnswer('');
      setTimeLeft(timerDuration);
      setGamePhase('playing');
      setIsCorrect(null);
      setTimerActive(true);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setGamePhase('finished');
    
    // Track game completion
    UserActionsService.trackCreate('activity', 'reverse-dictionary-completed', title, {
      action: 'game_completed',
      score,
      total: words.length,
      percentage: Math.round((score / words.length) * 100)
    });

    // Save game session (optional - could be stored in localStorage or database)
    const session: ReverseDictionaryGameSession = {
      score,
      total: words.length,
      date: new Date().toISOString(),
      gameTitle: title
    };

    // Store in localStorage for now
    const sessions = JSON.parse(localStorage.getItem('reverseDictionarySessions') || '[]');
    sessions.push(session);
    localStorage.setItem('reverseDictionarySessions', JSON.stringify(sessions.slice(-5))); // Keep last 5
  };

  const getEncouragementMessage = () => {
    const percentage = (score / words.length) * 100;
    
    if (percentage === 100) {
      return "🎉 Parfait ! Vous êtes un véritable expert !";
    } else if (percentage >= 80) {
      return "🌟 Excellent ! Vous maîtrisez vraiment bien le vocabulaire !";
    } else if (percentage >= 60) {
      return "👏 Très bien ! Vous avez de bonnes connaissances !";
    } else if (percentage >= 40) {
      return "💪 Bien joué ! Continuez à vous entraîner !";
    } else if (percentage >= 20) {
      return "🎯 C'est un bon début ! La pratique vous aidera à progresser !";
    } else {
      return "🌱 Chaque mot appris est une victoire ! Continuez vos efforts !";
    }
  };

  const getResultMessage = () => {
    if (isCorrect) {
      const messages = [
        "🎉 Bravo ! C'est exact !",
        "✨ Parfait ! Bien joué !",
        "🌟 Excellent ! Vous avez trouvé !",
        "👏 Fantastique ! C'est correct !",
        "💫 Superbe ! Bonne réponse !"
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    } else {
      return `⏰ Temps écoulé ! Le mot était : "${currentWord.word}"`;
    }
  };

  if (!gameStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-4">{title}</CardTitle>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 text-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span>{words.length} mots à deviner</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span>{timerDuration}s par mot</span>
                </div>
              </div>
              <p className="text-gray-600">
                Devinez le mot à partir de sa définition avant la fin du compte à rebours !
              </p>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={startGame} size="lg" className="text-lg px-8">
              Commencer le jeu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gamePhase === 'finished') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-4">🎯 Jeu terminé !</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex items-center justify-center gap-8 text-lg">
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-500" />
                <span className="font-bold">{score} / {words.length}</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((score / words.length) * 100)}%
              </div>
            </div>
            
            <div className="text-lg font-medium text-green-600">
              {getEncouragementMessage()}
            </div>
            
            <div className="pt-4">
              <Button onClick={() => window.location.reload()} size="lg">
                Rejouer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gamePhase === 'result') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Mot {currentWordIndex + 1} / {words.length}</CardTitle>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="font-bold">{score} points</span>
              </div>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2">
              {isCorrect ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
              <span className="text-xl font-medium">
                {getResultMessage()}
              </span>
            </div>

            {!isCorrect && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">Définition :</p>
                <p className="font-medium">{currentWord.definition}</p>
              </div>
            )}

            <Button onClick={handleContinue} size="lg">
              {currentWordIndex < words.length - 1 ? 'Continuer' : 'Voir le score final'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Mot {currentWordIndex + 1} / {words.length}</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="font-bold">{score} points</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Définition :</h3>
            <p className="text-lg leading-relaxed">{currentWord.definition}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Quel est ce mot ?
              </label>
              <Input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Tapez votre réponse..."
                className="text-lg"
                autoFocus
                disabled={!timerActive}
              />
            </div>
            
            <Button 
              type="submit" 
              size="lg" 
              className="w-full"
              disabled={!userAnswer.trim() || !timerActive}
            >
              Valider ma réponse
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReverseDictionaryGame;