
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TimelinePlayer } from '@/components/activities/timeline/TimelinePlayer';
import TimelineQuizPlayer from '@/components/activities/timeline/TimelineQuizPlayer';
import TimelinePlayerV2 from '@/components/activities/timeline/TimelinePlayerV2';
import { TimelineData } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';

const TimelineGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [useV2Gameplay, setUseV2Gameplay] = useState(true);
  
  const timelineData = location.state?.timelineData as TimelineData;

  console.log('🎮 TimelineGame - Timeline data received:', timelineData);
  console.log('🎮 TimelineGame - Number of events:', timelineData?.events?.length);
  console.log('🔍 TimelineGame - Date display settings analysis:', {
    showYearOnCard: timelineData?.showYearOnCard,
    showDateOnCard: timelineData?.showDateOnCard,
    typeOfShowYearOnCard: typeof timelineData?.showYearOnCard,
    typeOfShowDateOnCard: typeof timelineData?.showDateOnCard,
    fullTimelineData: timelineData
  });

  const handleExit = () => {
    navigate('/activities');
  };

  if (!timelineData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Erreur</h1>
          <p className="text-muted-foreground mb-6">Aucune donnée de jeu Timeline trouvée</p>
          <Button onClick={handleExit} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  // Vérifier si les événements ont des options de réponse pour déterminer le type de jeu
  const hasAnswerOptions = timelineData.events.some(event => 
    event.answerOptions && Array.isArray(event.answerOptions) && event.answerOptions.length >= 3
  );

  console.log('🎮 TimelineGame - Checking events for answer options:');
  timelineData.events.forEach((event, index) => {
    console.log(`🎮 Event ${index + 1}:`, {
      name: event.name,
      hasAnswerOptions: !!event.answerOptions,
      answerOptionsLength: event.answerOptions?.length || 0,
      answerOptions: event.answerOptions
    });
  });
  console.log('🎮 TimelineGame - hasAnswerOptions result:', hasAnswerOptions);

  // Si c'est un quiz, utiliser TimelineQuizPlayer directement
  if (hasAnswerOptions) {
    console.log('🎮 TimelineGame - Rendering TimelineQuizPlayer');
    return (
      <div className="min-h-screen bg-background">
        <TimelineQuizPlayer timelineData={timelineData} onExit={handleExit} />
      </div>
    );
  }

  // Pour les timelines normales, permettre de choisir entre les deux versions
  console.log('🎮 TimelineGame - Rendering timeline player with toggle');
  return (
    <div className="min-h-screen bg-background">
      {/* Sélecteur de version en haut */}
      <div className="bg-card border-b p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleExit} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h2 className="text-lg font-semibold text-foreground">Mode de jeu Timeline</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {useV2Gameplay ? 'Nouveau : Ordre numérique' : 'Classique : Glisser-déposer'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseV2Gameplay(!useV2Gameplay)}
              className="flex items-center gap-2"
            >
              {useV2Gameplay ? (
                <ToggleRight className="w-5 h-5 text-primary" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm">
                {useV2Gameplay ? 'V2' : 'V1'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Rendu du composant approprié */}
      {useV2Gameplay ? (
        <TimelinePlayerV2 timelineData={timelineData} onExit={handleExit} />
      ) : (
        <TimelinePlayer timelineData={timelineData} onExit={handleExit} />
      )}
    </div>
  );
};

export default TimelineGame;
