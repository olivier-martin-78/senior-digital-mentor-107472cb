import React, { useState } from 'react';
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
  
  const quizData = location.state?.quizData as QuizData;

  const handleExit = () => {
    navigate('/activities');
  };

  const handleAnswer = (answer: 'A' | 'B' | 'C') => {
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Quiz terminé !</h1>
          <p className="text-muted-foreground mb-6">
            Score final : {score} / {quizData.questions.length}
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
    <div className="min-h-screen bg-background">
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
          <span className="font-semibold text-primary">
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
      />
    </div>
  );
};

export default MusicQuizGame;