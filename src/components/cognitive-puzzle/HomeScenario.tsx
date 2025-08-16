import React from 'react';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/cognitivePuzzle';
import { homeScenario } from '@/data/cognitivePuzzleData';
import { DragDropZone } from './DragDropZone';
import { SpatialMap } from './SpatialMap';
import { Timeline } from './Timeline';
import { GameSuccess } from './GameSuccess';
import { ArrowLeft, Volume2, VolumeX, Accessibility, CheckCircle } from 'lucide-react';

interface HomeScenarioProps {
  gameState: GameState;
  onPlaceItem: (activityId: string, spatialSlotId?: string, timeSlotId?: string) => void;
  onRemoveItem: (activityId: string) => void;
  onCheckCompletion: () => boolean;
  onCompleteLevel: () => void;
  onNextLevel: () => void;
  onStartLevel: () => void;
  onBackToMenu: () => void;
  onSpeak: (text: string) => void;
}

export const HomeScenario: React.FC<HomeScenarioProps> = ({
  gameState,
  onPlaceItem,
  onRemoveItem,
  onCheckCompletion,
  onCompleteLevel,
  onNextLevel,
  onStartLevel,
  onBackToMenu,
  onSpeak,
}) => {
  const [draggedActivity, setDraggedActivity] = React.useState<string | null>(null);
  
  const currentLevel = homeScenario.levels.find(l => l.id === gameState.currentLevel);
  
  if (!currentLevel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Niveau introuvable</h2>
          <Button onClick={onBackToMenu}>Retour au menu</Button>
        </div>
      </div>
    );
  }

  const handleSpatialDrop = (spatialSlotId: string, activityId: string) => {
    const currentPlacement = gameState.placedItems.find(item => item.activityId === activityId);
    onPlaceItem(activityId, spatialSlotId, currentPlacement?.timeSlotId);
  };

  const handleTimeDrop = (timeSlotId: string, activityId: string) => {
    const currentPlacement = gameState.placedItems.find(item => item.activityId === activityId);
    onPlaceItem(activityId, currentPlacement?.spatialSlotId, timeSlotId);
  };

  const handleCheckLevel = () => {
    if (onCheckCompletion()) {
      onCompleteLevel();
    } else {
      onSpeak('Il manque encore quelques éléments à placer correctement');
    }
  };

  const renderInstructions = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
          <div className="text-6xl mb-6 animate-bounce">🏠</div>
          
          <h2 className={`
            font-bold text-foreground mb-4
            ${gameState.accessibilityMode ? 'text-3xl' : 'text-2xl'}
          `}>
            {currentLevel.name}
          </h2>
          
          <p className={`
            text-muted-foreground mb-6 leading-relaxed
            ${gameState.accessibilityMode ? 'text-lg' : 'text-base'}
          `}>
            {currentLevel.description}
          </p>

          {/* Level-specific Instructions */}
          <div className="bg-amber-50 rounded-2xl p-6 mb-6">
            <h3 className={`font-semibold text-amber-800 mb-3 ${gameState.accessibilityMode ? 'text-lg' : 'text-base'}`}>
              📋 Instructions
            </h3>
            
            {currentLevel.id === 1 && (
              <p className={`text-amber-700 ${gameState.accessibilityMode ? 'text-base' : 'text-sm'}`}>
                Glissez chaque activité vers le bon endroit de la maison. 
                {currentLevel.enableTimeline && ' Organisez aussi dans le temps !'}
              </p>
            )}
            
            {currentLevel.id === 2 && (
              <p className={`text-amber-700 ${gameState.accessibilityMode ? 'text-base' : 'text-sm'}`}>
                Maintenant, placez les activités dans l'espace ET dans le temps. 
                Chaque activité doit avoir un lieu et un moment appropriés.
              </p>
            )}
            
            {currentLevel.id === 3 && (
              <p className={`text-amber-700 ${gameState.accessibilityMode ? 'text-base' : 'text-sm'}`}>
                Créez une journée parfaite ! Organisez toutes les activités dans l'espace et le temps. 
                Attention aux surprises qui peuvent modifier vos plans !
              </p>
            )}
          </div>

          <Button
            onClick={() => {
              onSpeak(`Début du niveau ${currentLevel.id} : ${currentLevel.name}`);
              onStartLevel();
            }}
            size={gameState.accessibilityMode ? 'lg' : 'default'}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <span className="mr-2">🎯</span>
            Commencer le Niveau
          </Button>
        </div>
      </div>
    </div>
  );

  const renderGameplay = () => (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBackToMenu}
              variant="outline"
              size={gameState.accessibilityMode ? 'lg' : 'default'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Menu
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              <div>
                <h1 className={`font-bold text-foreground ${gameState.accessibilityMode ? 'text-xl' : 'text-lg'}`}>
                  {currentLevel.name}
                </h1>
                <p className={`text-muted-foreground ${gameState.accessibilityMode ? 'text-sm' : 'text-xs'}`}>
                  Niveau {currentLevel.id}/3
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
              <span className={`font-semibold text-foreground ${gameState.accessibilityMode ? 'text-base' : 'text-sm'}`}>
                Score: {gameState.score}
              </span>
            </div>
            
            <Button
              onClick={handleCheckLevel}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              size={gameState.accessibilityMode ? 'lg' : 'default'}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Vérifier
            </Button>
          </div>
        </div>

        {/* Game Areas */}
        <div className="grid gap-6">
          {/* Timeline (if enabled) */}
          {currentLevel.enableTimeline && (
            <Timeline
              timeSlots={currentLevel.timeSlots}
              placedItems={gameState.placedItems}
              activities={currentLevel.activities}
              accessibilityMode={gameState.accessibilityMode}
              onDrop={handleTimeDrop}
              onRemove={onRemoveItem}
              onSpeak={onSpeak}
            />
          )}

          {/* Spatial Map */}
          <SpatialMap
            spatialSlots={currentLevel.spatialSlots}
            placedItems={gameState.placedItems}
            activities={currentLevel.activities}
            accessibilityMode={gameState.accessibilityMode}
            scenario="home"
            onDrop={handleSpatialDrop}
            onRemove={onRemoveItem}
            onSpeak={onSpeak}
          />

          {/* Activities to Drag */}
          <DragDropZone
            activities={currentLevel.activities}
            placedItems={gameState.placedItems}
            accessibilityMode={gameState.accessibilityMode}
            onDragStart={(activity) => {
              setDraggedActivity(activity.id);
              onSpeak(`Début du déplacement de ${activity.name}`);
            }}
            onDragEnd={() => setDraggedActivity(null)}
            onSpeak={onSpeak}
          />
        </div>
      </div>
    </div>
  );

  // Render based on game phase
  if (gameState.gamePhase === 'instructions') {
    return renderInstructions();
  }

  if (gameState.gamePhase === 'success') {
    const isLastLevel = currentLevel.id === homeScenario.levels.length;
    return (
      <GameSuccess
        level={currentLevel}
        score={gameState.score}
        hadTwist={!!gameState.activeTwist}
        onNextLevel={onNextLevel}
        onReplay={() => {
          // In a real implementation, restart current level
          onSpeak('Redémarrage du niveau');
        }}
        onMenu={onBackToMenu}
        onSpeak={onSpeak}
        accessibilityMode={gameState.accessibilityMode}
        isLastLevel={isLastLevel}
      />
    );
  }

  return renderGameplay();
};