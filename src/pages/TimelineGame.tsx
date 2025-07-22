
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TimelinePlayer } from '@/components/activities/timeline/TimelinePlayer';
import { TimelineData } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TimelineGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const timelineData = location.state?.timelineData as TimelineData;

  const handleExit = () => {
    navigate(-1);
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

  return (
    <div className="min-h-screen bg-background">
      <TimelinePlayer timelineData={timelineData} onExit={handleExit} />
    </div>
  );
};

export default TimelineGame;
