import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
      
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
          {gameData.title || 'Jeu Memory'}
        </h1>
        
        {/* Ici vous pourrez intégrer le composant Memory Game quand il sera créé */}
        <div className="text-center text-muted-foreground">
          <p>Interface du jeu Memory à implémenter</p>
          <pre className="mt-4 p-4 bg-muted rounded text-left text-sm overflow-auto">
            {JSON.stringify(gameData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default MemoryGame;