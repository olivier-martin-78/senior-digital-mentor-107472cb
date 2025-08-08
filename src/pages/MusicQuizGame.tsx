import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MusicQuizPlayer } from '@/components/activities/MusicQuizPlayer';

interface QuizData {
  type: 'music_quiz';
  title: string;
  questions: any[];
  quizType: 'videos' | 'illustrations';
}

const MusicQuizGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'waiting' | 'answered'>('playing');
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  useEffect(() => {
    document.title = 'Quiz musical – Mode Joueur';
  }, []);
  
  const quizData = location.state?.quizData as QuizData;

  const handleExit = () => {
    navigate('/activities');
  };

  const handleAnswer = (questionId: string, answer: string) => {
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const isCorrect = currentQuestion.correctAnswer === answer;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setShowAnswer(true);
    setGameState('answered');
    
    setTimeout(() => {
      if (currentQuestionIndex < quizData.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setShowAnswer(false);
        setGameState('playing');
      } else {
        setIsFinished(true);
      }
    }, 2000);
  };

  if (!quizData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Erreur</h1>
          <p className="text-muted-foreground mb-6">Aucune donnée de quiz trouvée</p>
          <Button onClick={handleExit} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const percentage = (score / quizData.questions.length) * 100;
    
    const getEncouragementMessage = () => {
      if (percentage === 100) return "Parfait ! Tu es un vrai expert ! 🎉";
      if (percentage >= 80) return "Excellent travail ! Tu maîtrises bien le sujet ! 👏";
      if (percentage >= 60) return "Bien joué ! Continue comme ça ! 💪";
      if (percentage >= 40) return "Pas mal ! Avec un peu plus d'entraînement, tu vas y arriver ! 🌟";
      return "N'abandonne pas ! Chaque tentative te fait progresser ! 🚀";
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Quiz terminé !</h1>
          <p className="text-muted-foreground mb-4">
            Score final : {score} / {quizData.questions.length}
          </p>
          <p className="text-lg font-medium text-primary mb-6">
            {getEncouragementMessage()}
          </p>
          <Button onClick={handleExit} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux activités
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neon-quiz-bg">
      <div className="p-4 flex justify-between items-center">
        <Button onClick={handleExit} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        {/* Affichage du score en cours */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Question {currentQuestionIndex + 1} / {quizData.questions.length}
          </span>
          <span className="font-semibold text-[hsl(var(--neon-2))]">
            Score: {score} / {quizData.questions.length}
          </span>
        </div>
      </div>
      <div className="px-4 py-2 text-center">
        <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--neon-4))] to-[hsl(var(--neon-2))]">Quiz musical</h1>
      </div>
      
      <MusicQuizPlayer
        quizData={quizData}
        onAnswer={handleAnswer}
        currentQuestionIndex={currentQuestionIndex}
        gameState={gameState}
        showAnswer={showAnswer}
      />
    </div>
  );
};

export default MusicQuizGame;