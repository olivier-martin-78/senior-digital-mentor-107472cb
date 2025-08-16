import React from 'react';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/cognitivePuzzle';
import { homeScenario } from '@/data/cognitivePuzzleData';
import { DragDropZone } from './DragDropZone';
import { SpatialMap } from './SpatialMap';
import { Timeline } from './Timeline';
import { GameSuccess } from './GameSuccess';
import { VoiceHelpButton } from './VoiceHelpButton';
import { ArrowLeft, Volume2, VolumeX, Accessibility, CheckCircle } from 'lucide-react';

interface HomeScenarioProps {
  gameState: GameState;
  selectedActivity: string | null;
  onPlaceItem: (activityId: string, spatialSlotId?: string, timeSlotId?: string) => void;
  onRemoveItem: (activityId: string) => void;
  onCheckCompletion: () => boolean;
  onCompleteLevel: () => void;
  onNextLevel: () => void;
  onStartLevel: () => void;
  onBackToMenu: () => void;
  onSelectActivity: (activityId: string) => void;
  onPlaceSelected: (spatialSlotId?: string, timeSlotId?: string) => void;
  onSpeak: (text: string) => void;
}

export const HomeScenario: React.FC<HomeScenarioProps> = ({
  gameState,
  selectedActivity,
  onPlaceItem,
  onRemoveItem,
  onCheckCompletion,
  onCompleteLevel,
  onNextLevel,
  onStartLevel,
  onBackToMenu,
  onSelectActivity,
  onPlaceSelected,
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
    onPlaceItem(activityId, spatialSlotId);
  };

  const handleTimeDrop = (timeSlotId: string, activityId: string) => {
    onPlaceItem(activityId, undefined, timeSlotId);
  };

  const handleSpatialClick = (spatialSlotId: string) => {
    onPlaceSelected(spatialSlotId);
  };

  const handleTimeClick = (timeSlotId: string) => {
    onPlaceSelected(undefined, timeSlotId);
  };

  const handleCheckLevel = () => {
    const isComplete = onCheckCompletion();
    if (isComplete) {
      onCompleteLevel();
      // Removed automatic speech - now only on demand
    } else {
      // Removed automatic speech - now only on demand
    }
  };

  const renderInstructions = () => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-6xl mb-6">🏠</div>
          
          <h1 className={`font-bold text-foreground mb-4 ${gameState.accessibilityMode ? 'text-3xl' : 'text-2xl'}`}>
            {currentLevel.name}
          </h1>
          
          <p className={`text-muted-foreground mb-8 leading-relaxed ${gameState.accessibilityMode ? 'text-lg' : 'text-base'}`}>
            {currentLevel.description}
          </p>

          {/* Level-specific instructions */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-8">
            <div className="text-2xl mb-3">💡</div>
            <div className={`text-left space-y-3 ${gameState.accessibilityMode ? 'text-base' : 'text-sm'}`}>
              {currentLevel.id === 1 && (
                <div>
                  <p className="font-semibold text-blue-800 mb-2">Instructions :</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Placez chaque activité dans la bonne pièce de la maison</li>
                    <li>• Glissez les activités vers les zones appropriées</li>
                    <li>• Utilisez la logique : petit-déjeuner → cuisine, sieste → chambre...</li>
                  </ul>
                </div>
              )}
              {currentLevel.id === 2 && (
                <div>
                  <p className="font-semibold text-blue-800 mb-2">Instructions :</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• ⚠️ IMPORTANT : Chaque activité doit être placée dans une PIÈCE ET un MOMENT</li>
                    <li>• Glissez d'abord l'activité vers une pièce de la maison</li>
                    <li>• Puis glissez la MÊME activité vers un moment de la journée</li>
                    <li>• Une activité doit apparaître dans les deux sections pour être valide</li>
                  </ul>
                </div>
              )}
              {currentLevel.id === 3 && (
                <div>
                  <p className="font-semibold text-blue-800 mb-2">Instructions :</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Construisez une journée parfaite avec toutes les activités</li>
                    <li>• Soyez prêt à vous adapter aux imprévus</li>
                    <li>• Double placement : lieu ET moment pour chaque activité</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={onStartLevel}
            size={gameState.accessibilityMode ? 'lg' : 'default'}
            className={`
              bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
              text-white font-semibold px-8 py-3 rounded-2xl
              transform hover:scale-105 transition-all duration-200
              shadow-lg hover:shadow-xl
              ${gameState.accessibilityMode ? 'text-lg px-12 py-4' : ''}
            `}
          >
            Commencer le niveau
          </Button>

          {/* Voice Help Button */}
          <div className="mt-4">
            <VoiceHelpButton
              onSpeak={onSpeak}
              helpText={`Niveau ${currentLevel.id} : ${currentLevel.name}. ${currentLevel.description} Pour ce niveau, vous devez ${currentLevel.id === 1 ? 'placer chaque activité dans la bonne pièce de la maison' : currentLevel.id === 2 ? 'organiser les activités dans l\'espace et le temps en les plaçant dans les pièces et les moments de la journée' : 'construire une journée parfaite avec toutes les activités et vous adapter aux imprévus'}. Utilisez le glisser-déplacer ou cliquez sur une activité puis sur une zone.`}
              accessibilityMode={gameState.accessibilityMode}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderGameplay = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToMenu}
                className="hover:bg-white/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Menu
              </Button>
              <div className="flex items-center gap-3">
                <div className="text-2xl">🏠</div>
                <div>
                  <h2 className={`font-bold text-foreground ${gameState.accessibilityMode ? 'text-xl' : 'text-lg'}`}>
                    {currentLevel.name}
                  </h2>
                  <p className={`text-muted-foreground ${gameState.accessibilityMode ? 'text-base' : 'text-sm'}`}>
                    Niveau {gameState.currentLevel}/3
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-semibold">
                ⭐ {gameState.score} points
              </div>
              <VoiceHelpButton
                onSpeak={onSpeak}
                helpText={`Vous êtes dans le niveau ${gameState.currentLevel} : ${currentLevel.name}. ${selectedActivity ? `Vous avez sélectionné l'activité ${currentLevel.activities.find(a => a.id === selectedActivity)?.name}. Cliquez maintenant sur une zone pour la placer.` : 'Vous pouvez glisser les activités vers les zones ou cliquer sur une activité puis sur une zone.'} ${currentLevel.enableTimeline ? 'N\'oubliez pas de placer les activités dans l\'espace ET dans le temps.' : 'Placez chaque activité dans la bonne zone.'} ${gameState.placedItems.length} activités déjà placées sur ${currentLevel.activities.length}.`}
                accessibilityMode={gameState.accessibilityMode}
                className="mr-2"
              />
              <Button
                onClick={handleCheckLevel}
                className={`
                  bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700
                  text-white font-semibold rounded-2xl
                  transform hover:scale-105 transition-all duration-200
                  ${gameState.accessibilityMode ? 'px-6 py-3 text-lg' : 'px-4 py-2'}
                `}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Vérifier
              </Button>
            </div>
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
              selectedActivity={selectedActivity}
              accessibilityMode={gameState.accessibilityMode}
              onDrop={handleTimeDrop}
              onPlaceSelected={handleTimeClick}
              onRemove={onRemoveItem}
              onSpeak={onSpeak}
            />
          )}

          {/* Spatial Map */}
          <SpatialMap
            spatialSlots={currentLevel.spatialSlots}
            placedItems={gameState.placedItems}
            activities={currentLevel.activities}
            selectedActivity={selectedActivity}
            accessibilityMode={gameState.accessibilityMode}
            scenario="home"
            onDrop={handleSpatialDrop}
            onPlaceSelected={handleSpatialClick}
            onRemove={onRemoveItem}
            onSpeak={onSpeak}
          />

          {/* Activities to Drag */}
          <DragDropZone
            activities={currentLevel.activities}
            placedItems={gameState.placedItems}
            selectedActivity={selectedActivity}
            accessibilityMode={gameState.accessibilityMode}
            onDragStart={(activity) => {
              setDraggedActivity(activity.id);
              // Removed automatic speech - now only on demand
            }}
            onDragEnd={() => setDraggedActivity(null)}
            onSelectActivity={onSelectActivity}
            onSpeak={onSpeak}
          />
        </div>
      </div>
    </div>
  );

  // Render different views based on game phase
  if (gameState.gamePhase === 'instructions') {
    return renderInstructions();
  }

  if (gameState.gamePhase === 'success') {
    return (
      <GameSuccess
        level={currentLevel}
        score={gameState.score}
        hadTwist={gameState.activeTwist !== null}
        onNextLevel={onNextLevel}
        onReplay={onStartLevel}
        onMenu={onBackToMenu}
        accessibilityMode={gameState.accessibilityMode}
        isLastLevel={currentLevel.id === 3}
        onSpeak={onSpeak}
      />
    );
  }

  return renderGameplay();
};
