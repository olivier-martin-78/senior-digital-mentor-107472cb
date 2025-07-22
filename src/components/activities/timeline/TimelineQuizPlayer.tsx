import React, { useState, useEffect } from 'react';
import { TimelineData, TimelineEvent } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, RotateCcw, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TimelineQuizPlayerProps {
  timelineData: TimelineData;
  onExit: () => void;
}

interface QuizGameState {
  currentEventIndex: number;
  score: number;
  gameComplete: boolean;
  answered: boolean;
  selectedAnswer: string | null;
  correctAnswer: string;
  shuffledEvents: TimelineEvent[];
}

const TimelineQuizPlayer: React.FC<TimelineQuizPlayerProps> = ({ timelineData, onExit }) => {
  const [gameState, setGameState] = useState<QuizGameState>({
    currentEventIndex: 0,
    score: 0,
    gameComplete: false,
    answered: false,
    selectedAnswer: null,
    correctAnswer: '',
    shuffledEvents: []
  });
  
  const [showFeedback, setShowFeedback] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: false, message: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🎮 Timeline Quiz - Initializing with data:', timelineData);
    initializeGame();
  }, [timelineData]);

  const validateTimelineData = (): boolean => {
    console.log('🔍 Validating timeline data...');
    
    if (!timelineData) {
      console.error('❌ No timeline data provided');
      setError('Aucune donnée de timeline fournie');
      return false;
    }

    if (!timelineData.events || !Array.isArray(timelineData.events)) {
      console.error('❌ Events is not an array:', timelineData.events);
      setError('Les événements ne sont pas correctement définis');
      return false;
    }

    if (timelineData.events.length < 2) {
      console.error('❌ Not enough events:', timelineData.events.length);
      setError('Il faut au moins 2 événements pour jouer au Quiz Timeline');
      return false;
    }

    // Valider que chaque événement a des options de réponse
    const eventsWithoutOptions = timelineData.events.filter(event => 
      !event.answerOptions || !Array.isArray(event.answerOptions) || event.answerOptions.length !== 3
    );
    
    if (eventsWithoutOptions.length > 0) {
      console.error('❌ Events without answer options found:', eventsWithoutOptions);
      setError('Certains événements n\'ont pas les 3 options de réponse requises');
      return false;
    }

    console.log('✅ Timeline data validation successful');
    return true;
  };

  const initializeGame = () => {
    try {
      console.log('🚀 Initializing Timeline Quiz...');
      setError(null);

      if (!validateTimelineData()) {
        return;
      }

      const shuffledEvents = [...timelineData.events].sort(() => Math.random() - 0.5);
      
      setGameState({
        currentEventIndex: 0,
        score: 0,
        gameComplete: false,
        answered: false,
        selectedAnswer: null,
        correctAnswer: shuffledEvents[0]?.year || '',
        shuffledEvents
      });

      console.log('✅ Quiz initialized successfully');
      
    } catch (error) {
      console.error('💥 Error initializing quiz:', error);
      setError('Erreur lors de l\'initialisation du quiz');
    }
  };

  const handleAnswerSelect = (selectedAnswer: string) => {
    if (gameState.answered) return;

    const currentEvent = gameState.shuffledEvents[gameState.currentEventIndex];
    const isCorrect = selectedAnswer === currentEvent.year;
    
    setGameState(prev => ({
      ...prev,
      answered: true,
      selectedAnswer,
      score: isCorrect ? prev.score + 1 : prev.score
    }));

    setShowFeedback({
      show: true,
      success: isCorrect,
      message: isCorrect 
        ? `Correct ! L'événement "${currentEvent.name}" s'est déroulé en ${currentEvent.year}.`
        : `Incorrect ! L'événement "${currentEvent.name}" s'est déroulé en ${currentEvent.year}, pas en ${selectedAnswer}.`
    });
  };

  const handleNextQuestion = () => {
    const nextIndex = gameState.currentEventIndex + 1;
    const isGameComplete = nextIndex >= gameState.shuffledEvents.length;
    
    if (isGameComplete) {
      setGameState(prev => ({
        ...prev,
        gameComplete: true
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        currentEventIndex: nextIndex,
        answered: false,
        selectedAnswer: null,
        correctAnswer: prev.shuffledEvents[nextIndex]?.year || ''
      }));
    }
    
    setShowFeedback({ show: false, success: false, message: '' });
  };

  const restartGame = () => {
    console.log('🔄 Restarting quiz');
    initializeGame();
    setShowFeedback({ show: false, success: false, message: '' });
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-background text-foreground">
        <div className="flex justify-between items-center mb-6 p-4 bg-card text-card-foreground rounded-lg border">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{timelineData?.timelineName || 'Timeline Quiz'}</h1>
            <p className="text-muted-foreground">par {timelineData?.creatorName || 'Inconnu'}</p>
          </div>
        </div>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold text-destructive mb-2">Erreur de chargement</h2>
          <p className="text-foreground mb-4">{error}</p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={onExit}>
              Retour
            </Button>
            <Button onClick={restartGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentEvent = gameState.shuffledEvents[gameState.currentEventIndex];
  
  if (!currentEvent) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-background text-foreground">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <p>Aucun événement à afficher</p>
          <Button onClick={onExit} className="mt-4">Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground">
      {/* Bouton Retour en haut à gauche */}
      <div className="mb-4">
        <Button variant="outline" onClick={onExit} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
      </div>

      {/* Header avec score */}
      <div className="flex justify-between items-center mb-6 p-4 bg-card text-card-foreground rounded-lg border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{timelineData.timelineName}</h1>
          <p className="text-muted-foreground">par {timelineData.creatorName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Score: {gameState.score}/{gameState.shuffledEvents.length}</p>
          <p className="text-sm text-muted-foreground">Question {gameState.currentEventIndex + 1}/{gameState.shuffledEvents.length}</p>
        </div>
      </div>

      {/* Carte de l'événement */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {currentEvent.imageUrl && (
            <img 
              src={currentEvent.imageUrl} 
              alt={currentEvent.name}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
          )}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">{currentEvent.name}</h2>
            <p className="text-lg text-muted-foreground">{currentEvent.description}</p>
            {currentEvent.category && (
              <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                {currentEvent.category}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question et options */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            Quand cet événement a-t-il eu lieu ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentEvent.answerOptions?.map((option, index) => (
              <Button
                key={index}
                variant={
                  gameState.answered
                    ? option === currentEvent.year
                      ? "default"
                      : gameState.selectedAnswer === option
                      ? "destructive"
                      : "outline"
                    : "outline"
                }
                size="lg"
                onClick={() => handleAnswerSelect(option)}
                disabled={gameState.answered}
                className="h-16 text-lg"
              >
                {String.fromCharCode(65 + index)}) {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bouton suivant */}
      {gameState.answered && (
        <div className="text-center mb-6">
          <Button onClick={handleNextQuestion} size="lg">
            {gameState.currentEventIndex < gameState.shuffledEvents.length - 1 
              ? "Question suivante" 
              : "Voir les résultats"
            }
          </Button>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onExit}>
          Quitter
        </Button>
        <Button variant="outline" onClick={restartGame}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Recommencer
        </Button>
      </div>

      {/* Dialog de feedback */}
      <Dialog open={showFeedback.show} onOpenChange={() => setShowFeedback({ show: false, success: false, message: '' })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={`text-center ${showFeedback.success ? 'text-green-600' : 'text-red-600'}`}>
              {showFeedback.success ? '🎉 Correct !' : '❌ Incorrect !'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-foreground">{showFeedback.message}</p>
        </DialogContent>
      </Dialog>

      {/* Dialog de fin de jeu */}
      <Dialog open={gameState.gameComplete} onOpenChange={(open) => !open && onExit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-foreground">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              Quiz terminé !
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-lg text-foreground">
              Votre score final : <span className="font-bold text-primary text-2xl">{gameState.score}/{gameState.shuffledEvents.length}</span>
            </p>
            <p className="text-muted-foreground">
              {gameState.score === gameState.shuffledEvents.length 
                ? "Parfait ! Vous avez tout bon !" 
                : gameState.score >= gameState.shuffledEvents.length * 0.7
                ? "Très bien joué !"
                : "Continuez à vous entraîner !"
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={restartGame}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Rejouer
              </Button>
              <Button onClick={onExit}>
                Quitter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimelineQuizPlayer;