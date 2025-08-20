import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameScenario, GameState } from '@/hooks/useObjectAssemblyGame';

interface ScenarioSelectorProps {
  scenarios: GameScenario[];
  onSelectScenario: (scenarioId: string) => void;
  gameState: GameState;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  scenarios,
  onSelectScenario,
  gameState
}) => {
  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucun scénario disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scenarios.map((scenario) => (
        <Card
          key={scenario.id}
          className={`transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
            gameState.accessibilityMode ? 'min-h-[200px]' : ''
          }`}
          onClick={() => onSelectScenario(scenario.id)}
        >
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-4xl">{getScenarioIcon(scenario.name)}</div>
              <Badge variant="secondary">
                {scenario.levels.length} niveaux
              </Badge>
            </div>
            <CardTitle className={gameState.accessibilityMode ? 'text-xl' : 'text-lg'}>
              {scenario.name}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <CardDescription className={gameState.accessibilityMode ? 'text-base' : 'text-sm'}>
              {scenario.description}
            </CardDescription>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Progression :</p>
              <div className="flex flex-wrap gap-1">
                {scenario.levels.map((level) => (
                  <Badge
                    key={level.id}
                    variant="outline"
                    className="text-xs"
                  >
                    Niveau {level.level_number}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button 
              className={`w-full ${gameState.accessibilityMode ? 'h-12 text-lg' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectScenario(scenario.id);
              }}
            >
              Jouer
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const getScenarioIcon = (scenarioName: string): string => {
  switch (scenarioName) {
    case 'Routine Cuisine':
      return '🏠🍽️';
    case 'Organisation Chambre':
      return '🛏️👕';
    case 'Relaxation Salon':
      return '🛋️📚';
    case 'Hygiène Salle de bain':
      return '🚿🧼';
    case 'Entretien Jardin':
      return '🌱🌿';
    default:
      return '🏠';
  }
};