import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MemoryGamePlayer } from '@/components/activities/MemoryGamePlayer';

const MemoryGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const gameData = location.state?.gameData;

  const handleExit = () => {
    navigate(-1);
  };

  if (!gameData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Erreur</h1>
          <p className="text-muted-foreground mb-6">Aucune donnée de jeu trouvée</p>
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
      <div className="p-4">
        <Button onClick={handleExit} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
      
      <MemoryGamePlayer gameData={gameData} />
    </div>
  );
};

export default MemoryGame;