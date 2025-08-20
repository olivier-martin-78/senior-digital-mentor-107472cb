import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, ArrowRight, Home, Star } from 'lucide-react';
import { useObjectAssemblyGame } from '@/hooks/useObjectAssemblyGame';

interface VictoryScreenProps {
  onNext: () => void;
  onMenu: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  onNext,
  onMenu
}) => {
  const { gameState, scenarios } = useObjectAssemblyGame();

  const currentScenario = scenarios.find(s => s.id === gameState.currentScenario);
  const isLastLevel = currentScenario ? 
    gameState.currentLevel >= currentScenario.levels.length : true;

  const getPerformanceRating = () => {
    if (gameState.currentErrors === 0 && gameState.hintsUsed === 0) return 'Parfait !';
    if (gameState.currentErrors <= 1) return 'Excellent !';
    if (gameState.currentErrors <= 3) return 'Très bien !';
    return 'Bien joué !';
  };

  const getStarRating = () => {
    if (gameState.currentErrors === 0 && gameState.hintsUsed === 0) return 3;
    if (gameState.currentErrors <= 1) return 2;
    return 1;
  };

  const stars = getStarRating();

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-success/20 rounded-full">
            <Trophy className="h-16 w-16 text-success" />
          </div>
        </div>
        
        <CardTitle className="text-3xl text-success">
          🎉 Niveau terminé !
        </CardTitle>
        
        <p className="text-xl text-muted-foreground">
          {getPerformanceRating()}
        </p>
      </CardHeader>

      <CardContent className="space-y-6 text-center">
        {/* Star Rating */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Star
              key={index}
              className={`h-8 w-8 ${
                index < stars 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-muted-foreground'
              }`}
            />
          ))}
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-primary">{gameState.score}</p>
            <p className="text-sm text-muted-foreground">Points gagnés</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {gameState.currentErrors}
            </p>
            <p className="text-sm text-muted-foreground">Erreurs</p>
          </div>
        </div>

        {/* Encouraging Message */}
        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-primary font-medium">
            {gameState.currentErrors === 0 
              ? "Performance parfaite ! Vous maîtrisez parfaitement ce niveau." 
              : gameState.currentErrors <= 2
              ? "Excellente organisation ! Votre mémoire spatiale et temporelle s'améliore."
              : "Beau travail ! Continuez à pratiquer pour renforcer vos capacités cognitives."
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={onMenu}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Menu principal
          </Button>

          {!isLastLevel ? (
            <Button
              onClick={onNext}
              className="gap-2"
            >
              Niveau suivant
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={onMenu}
              className="gap-2"
            >
              Nouveau scénario
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Scenario Completion Badge */}
        {isLastLevel && (
          <div className="pt-4">
            <Badge variant="default" className="text-lg px-4 py-2">
              🏆 Scénario "{currentScenario?.name}" terminé !
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};