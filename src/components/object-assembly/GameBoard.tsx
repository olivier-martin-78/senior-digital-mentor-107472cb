import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useObjectAssemblyGame } from '@/hooks/useObjectAssemblyGame';
import { SpatialGrid } from './SpatialGrid';
import { TemporalTimeline } from './TemporalTimeline';
import { DraggableObjectsList } from './DraggableObjectsList';

export const GameBoard: React.FC = () => {
  const { 
    gameState, 
    selectedActivity, 
    scenarios, 
    selectActivity, 
    placeSelectedActivity, 
    speak 
  } = useObjectAssemblyGame();

  const currentScenario = scenarios.find(s => s.id === gameState.currentScenario);
  const currentLevel = currentScenario?.levels.find(l => l.level_number === gameState.currentLevel);

  if (!currentScenario || !currentLevel) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Niveau non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary">
          {currentScenario.name} - {currentLevel.name}
        </h2>
        <p className="text-muted-foreground">{currentLevel.description}</p>
      </div>

      {/* Timeline (if enabled) */}
      {currentLevel.enable_timeline && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{currentLevel.temporal_icon}</span>
              {currentLevel.temporal_title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TemporalTimeline 
              timeSlots={currentLevel.timeSlots}
              placedItems={gameState.placedItems}
              activities={currentLevel.activities}
              selectedActivity={selectedActivity}
              accessibilityMode={gameState.accessibilityMode}
              onPlaceSelected={(timeSlotId) => placeSelectedActivity(undefined, timeSlotId)}
              onSpeak={speak}
            />
          </CardContent>
        </Card>
      )}

      {/* Spatial Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{currentLevel.spatial_icon}</span>
            {currentLevel.spatial_title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SpatialGrid 
            spatialSlots={currentLevel.spatialSlots}
            placedItems={gameState.placedItems}
            activities={currentLevel.activities}
            selectedActivity={selectedActivity}
            accessibilityMode={gameState.accessibilityMode}
            onPlaceSelected={placeSelectedActivity}
            onSpeak={speak}
          />
        </CardContent>
      </Card>

      {/* Objects List */}
      <Card>
        <CardHeader>
          <CardTitle>Objets à placer</CardTitle>
        </CardHeader>
        <CardContent>
          <DraggableObjectsList 
            activities={currentLevel.activities}
            placedItems={gameState.placedItems}
            selectedActivity={selectedActivity}
            accessibilityMode={gameState.accessibilityMode}
            adaptationLevel={gameState.adaptationLevel}
            onSelectActivity={selectActivity}
            onSpeak={speak}
          />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Instructions :</strong> Cliquez sur un objet puis sur une zone, ou glissez les objets vers les zones appropriées.
              {currentLevel.enable_timeline && ' Organisez aussi les étapes dans le bon ordre.'}
            </p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span>✅ Placement spatial requis : {currentLevel.spatial_required}</span>
              {currentLevel.enable_timeline && (
                <span>⏰ Étapes temporelles requises : {currentLevel.temporal_required}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};