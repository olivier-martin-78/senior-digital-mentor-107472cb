import React, { useState, useEffect } from 'react';
import { TimelineData, TimelineEvent, TimelineGameState } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, RotateCcw, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TimelinePlayerProps {
  timelineData: TimelineData;
  onExit: () => void;
}

interface EventCardProps {
  event: TimelineEvent;
  showYear: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  showYear, 
  isDragging, 
  onDragStart, 
  onDragEnd 
}) => (
  <Card 
    className={`w-64 cursor-grab transition-all duration-200 ${
      isDragging ? 'opacity-50 scale-95' : 'hover:shadow-lg'
    }`}
    draggable={!!onDragStart}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
  >
    <CardContent className="p-4">
      {event.imageUrl && (
        <img 
          src={event.imageUrl} 
          alt={event.name}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      )}
      <div className="space-y-2">
        <h3 className="font-bold text-lg text-foreground">{event.name}</h3>
        {showYear && (
          <p className="text-xl font-semibold text-primary">{event.year}</p>
        )}
        <p className="text-sm text-muted-foreground">{event.description}</p>
        {event.category && (
          <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
            {event.category}
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

interface DropZoneProps {
  onDrop: () => void;
  isActive: boolean;
  onDragEnter?: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onDrop, isActive, onDragEnter }) => (
  <div
    className={`w-full h-16 border-2 border-dashed rounded-lg transition-all duration-200 flex items-center justify-center ${
      isActive 
        ? 'border-primary bg-primary/10 scale-105' 
        : 'border-muted-foreground/30 bg-muted/20'
    }`}
    onDragOver={(e) => e.preventDefault()}
    onDragEnter={onDragEnter}
    onDrop={(e) => {
      e.preventDefault();
      onDrop();
    }}
  >
    <span className="text-sm text-muted-foreground">
      {isActive ? 'Relâchez ici' : 'Zone de dépôt'}
    </span>
  </div>
);

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({ timelineData, onExit }) => {
  const [gameState, setGameState] = useState<TimelineGameState>({
    placedEvents: [],
    remainingEvents: [],
    currentEvent: null,
    score: 0,
    gameComplete: false
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: false, message: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🎮 Timeline Player - Initializing with data:', timelineData);
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
      setError('Il faut au moins 2 événements pour jouer à Timeline');
      return false;
    }

    // Valider chaque événement
    const invalidEvents = timelineData.events.filter(event => 
      !event.name || !event.year || !event.description
    );
    
    if (invalidEvents.length > 0) {
      console.error('❌ Invalid events found:', invalidEvents);
      setError('Certains événements sont incomplets (nom, année ou description manquante)');
      return false;
    }

    // Valider que les années sont convertibles en nombres
    const invalidYears = timelineData.events.filter(event => {
      const year = parseInt(event.year);
      return isNaN(year);
    });

    if (invalidYears.length > 0) {
      console.error('❌ Invalid years found:', invalidYears);
      setError('Certaines années ne sont pas valides');
      return false;
    }

    console.log('✅ Timeline data validation successful');
    return true;
  };

  const initializeGame = () => {
    try {
      console.log('🚀 Initializing Timeline game...');
      setError(null);

      if (!validateTimelineData()) {
        return;
      }

      const events = [...timelineData.events];
      console.log('📝 Events to shuffle:', events);
      
      const shuffled = events.sort(() => Math.random() - 0.5);
      console.log('🔀 Shuffled events:', shuffled);
      
      const firstEvent = shuffled[0];
      const remaining = shuffled.slice(1);

      console.log('🎯 First event:', firstEvent);
      console.log('📚 Remaining events:', remaining.length);

      setGameState({
        placedEvents: [firstEvent],
        remainingEvents: remaining,
        currentEvent: remaining.length > 0 ? remaining[0] : null,
        score: 0,
        gameComplete: false
      });

      console.log('✅ Game initialized successfully');
      
    } catch (error) {
      console.error('💥 Error initializing game:', error);
      setError('Erreur lors de l\'initialisation du jeu');
    }
  };

  const isCorrectPlacement = (event: TimelineEvent, position: number): boolean => {
    const newTimeline = [...gameState.placedEvents];
    newTimeline.splice(position, 0, event);
    
    // Vérifier que la timeline reste chronologiquement correcte
    for (let i = 0; i < newTimeline.length - 1; i++) {
      const currentYear = parseInt(newTimeline[i].year);
      const nextYear = parseInt(newTimeline[i + 1].year);
      if (currentYear > nextYear) {
        return false;
      }
    }
    return true;
  };

  const handleDrop = (position: number) => {
    if (!gameState.currentEvent) return;

    console.log('🎯 Dropping event at position:', position);
    const isCorrect = isCorrectPlacement(gameState.currentEvent, position);
    
    if (isCorrect) {
      // Placement correct
      const newPlacedEvents = [...gameState.placedEvents];
      newPlacedEvents.splice(position, 0, gameState.currentEvent);
      
      const newRemainingEvents = gameState.remainingEvents.slice(1);
      const nextEvent = newRemainingEvents.length > 0 ? newRemainingEvents[0] : null;
      
      setGameState(prev => ({
        ...prev,
        placedEvents: newPlacedEvents,
        remainingEvents: newRemainingEvents,
        currentEvent: nextEvent,
        score: prev.score + 1,
        gameComplete: newRemainingEvents.length === 0
      }));

      setShowFeedback({
        show: true,
        success: true,
        message: 'Excellent ! Vous avez gagné 1 point !'
      });
    } else {
      // Placement incorrect
      setGameState(prev => ({
        ...prev,
        score: Math.max(0, prev.score - 1)
      }));

      setShowFeedback({
        show: true,
        success: false,
        message: 'Incorrect ! Vous perdez 1 point. Réessayez !'
      });
    }

    setIsDragging(false);
    setDragOverIndex(null);
    
    setTimeout(() => {
      setShowFeedback({ show: false, success: false, message: '' });
    }, 2000);
  };

  const handleDragStart = (e: React.DragEvent) => {
    console.log('🖱️ Drag started');
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    console.log('🖱️ Drag ended');
    setIsDragging(false);
    setDragOverIndex(null);
  };

  const restartGame = () => {
    console.log('🔄 Restarting game');
    initializeGame();
    setShowFeedback({ show: false, success: false, message: '' });
  };

  const shouldShowYear = () => {
    return timelineData.showYearOnCard === true;
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-background text-foreground">
        <div className="flex justify-between items-center mb-6 p-4 bg-card text-card-foreground rounded-lg border">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{timelineData?.timelineName || 'Timeline'}</h1>
            <p className="text-muted-foreground">par {timelineData?.creatorName || 'Inconnu'}</p>
          </div>
        </div>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold text-destructive mb-2">Erreur de chargement</h2>
          <p className="text-foreground mb-4">{error}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={restartGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground">

      {/* Header avec score */}
      <div className="flex justify-between items-center mb-6 p-4 bg-card text-card-foreground rounded-lg border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{timelineData.timelineName}</h1>
          <p className="text-muted-foreground">par {timelineData.creatorName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-3xl font-bold text-primary">{gameState.score}</p>
        </div>
      </div>

      {/* Timeline verticale */}
      <div className="flex flex-col items-center space-y-4 mb-8">
        {/* Première zone de drop */}
        <DropZone 
          onDrop={() => handleDrop(0)}
          isActive={dragOverIndex === 0 && isDragging}
          onDragEnter={() => setDragOverIndex(0)}
        />

        {gameState.placedEvents.map((event, index) => (
          <React.Fragment key={event.id}>
            <EventCard 
              event={event} 
              showYear={shouldShowYear()}
            />
            
            {/* Zone de drop après chaque événement */}
            <DropZone 
              onDrop={() => handleDrop(index + 1)}
              isActive={dragOverIndex === index + 1 && isDragging}
              onDragEnter={() => setDragOverIndex(index + 1)}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Zone de pioche */}
      {gameState.currentEvent && !gameState.gameComplete && (
        <div className="bg-muted/50 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 text-center text-foreground">
            Événement à placer ({gameState.remainingEvents.length + 1} restant{gameState.remainingEvents.length > 0 ? 's' : ''})
          </h3>
          <div className="flex justify-center">
            <EventCard
              event={gameState.currentEvent}
              showYear={shouldShowYear()}
              isDragging={isDragging}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Glissez cette carte vers la position chronologique correcte
          </p>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-center gap-4 mt-6">
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
              {showFeedback.success ? '🎉 Bravo !' : '❌ Oups !'}
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
              Jeu terminé !
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-lg text-foreground">
              Votre score final : <span className="font-bold text-primary text-2xl">{gameState.score}</span>
            </p>
            <p className="text-muted-foreground">
              Vous avez placé tous les événements sur la timeline !
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={restartGame}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Rejouer
              </Button>
              <Button onClick={() => {
                // Forcer la fermeture du jeu
                onExit();
              }}>
                Quitter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
