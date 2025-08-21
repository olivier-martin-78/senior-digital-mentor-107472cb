import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Music } from 'lucide-react';
import { MusicQuizPlayer } from '@/components/activities/MusicQuizPlayer';
import { useToast } from '@/hooks/use-toast';

interface QuizData {
  type: 'music_quiz';
  title: string;
  questions: any[];
  quizType: 'videos' | 'illustrations';
  showInstructionAfterAnswer?: boolean;
}

const MusicQuizGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'waiting' | 'answered'>('playing');
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);
  
  useEffect(() => {
    document.title = 'Quiz musical – Mode Joueur';
  }, []);

  // Redirection automatique si pas de données de quiz
  useEffect(() => {
    if (!location.state?.quizData) {
      toast({
        title: "Accès direct non autorisé",
        description: "Veuillez sélectionner un quiz depuis la page des activités.",
        variant: "destructive",
      });
      
      // Redirection après un court délai pour permettre à l'utilisateur de lire le message
      const timer = setTimeout(() => {
        navigate('/activities', { replace: true });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, toast]);

  // Réinitialiser les states lors du changement de question
  useEffect(() => {
    setShowInstruction(false);
    setShowAnswer(false);
    setGameState('playing');
  }, [currentQuestionIndex]);
  
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
    
    if (quizData.showInstructionAfterAnswer && currentQuestion.instruction) {
      setShowInstruction(true);
    } else {
      setTimeout(() => {
        proceedToNext();
      }, 2000);
    }
  };

  const proceedToNext = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
      setShowInstruction(false);
      setGameState('playing');
    } else {
      setIsFinished(true);
    }
  };

  const handleNextQuestion = () => {
    setShowInstruction(false);
    proceedToNext();
  };

  if (!quizData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Quiz musical non trouvé</h1>
            <p className="text-muted-foreground mb-2">
              Vous avez accédé directement à cette page sans sélectionner de quiz.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Redirection automatique vers la page des activités dans quelques secondes...
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={handleExit} className="w-full">
              <Music className="w-4 h-4 mr-2" />
              Voir tous les quiz musicaux
            </Button>
            <Button onClick={handleExit} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux activités
            </Button>
          </div>
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
        <Button onClick={handleExit} variant="outline" size="sm" className="neon-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        {/* Affichage du score en cours */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Question {currentQuestionIndex + 1} / {quizData.questions.length}
          </span>
          <span className="font-semibold neon-text text-lg">
            Score: {score} / {quizData.questions.length}
          </span>
        </div>
      </div>
      
      <MusicQuizPlayer
        quizData={quizData}
        onAnswer={handleAnswer}
        currentQuestionIndex={currentQuestionIndex}
        gameState={gameState}
        showAnswer={showAnswer}
        showInstruction={showInstruction}
        onNextQuestion={handleNextQuestion}
      />
    </div>
  );
};

export default MusicQuizGame;