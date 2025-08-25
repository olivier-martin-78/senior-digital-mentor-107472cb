import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, RotateCcw, Star, Clock, Target } from 'lucide-react';
import { GameResult } from '@/types/audioMemoryGame';

interface GameResultsProps {
  gameResult: GameResult;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const GameResults: React.FC<GameResultsProps> = ({
  gameResult,
  onPlayAgain,
  onExit
}) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getScoreColor = () => {
    if (gameResult.totalScore >= 50) return 'text-green-600';
    if (gameResult.totalScore >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <Trophy className="w-6 h-6" />
            Résultats de la partie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score principal */}
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
              {gameResult.totalScore}
            </div>
            <div className="text-xl text-muted-foreground">Points</div>
            {gameResult.bonusPoints > 0 && (
              <Badge variant="secondary" className="mt-2">
                <Star className="w-4 h-4 mr-1" />
                Bonus: {gameResult.bonusPoints} pts
              </Badge>
            )}
          </div>

          {/* Stats détaillées */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{gameResult.accuracy.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Précision</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatTime(gameResult.totalTime)}</div>
              <div className="text-sm text-muted-foreground">Temps total</div>
            </div>
          </div>

          {/* Scores par phase */}
          <div className="space-y-3">
            <h4 className="font-semibold text-center">Détail par phase</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 p-3 rounded text-center">
                <div className="font-bold">{gameResult.phase1Score}</div>
                <div className="text-xs text-muted-foreground">Phase 1</div>
              </div>
              <div className="bg-muted/50 p-3 rounded text-center">
                <div className="font-bold">{gameResult.phase2Score}</div>
                <div className="text-xs text-muted-foreground">Phase 2</div>
              </div>
              <div className="bg-muted/50 p-3 rounded text-center">
                <div className="font-bold">{gameResult.phase3Score}</div>
                <div className="text-xs text-muted-foreground">Phase 3</div>
              </div>
              <div className="bg-muted/50 p-3 rounded text-center">
                <div className="font-bold">{gameResult.phase4Score}</div>
                <div className="text-xs text-muted-foreground">Phase 4</div>
              </div>
            </div>
          </div>

          {/* Message de félicitations */}
          <div className="text-center bg-primary/10 p-4 rounded-lg">
            {gameResult.completedPhase4 ? (
              <div className="text-primary font-semibold">
                🎉 Excellent ! Séquence parfaite reconstituée !
              </div>
            ) : gameResult.totalScore >= 30 ? (
              <div className="text-green-600 font-semibold">
                👏 Très bon travail ! Belle performance !
              </div>
            ) : (
              <div className="text-blue-600 font-semibold">
                💪 Continuez à vous entraîner, vous progressez !
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button onClick={onPlayAgain} size="lg">
              <RotateCcw className="w-5 h-5 mr-2" />
              Rejouer
            </Button>
            <Button onClick={onExit} variant="outline" size="lg">
              Retour aux jeux
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};