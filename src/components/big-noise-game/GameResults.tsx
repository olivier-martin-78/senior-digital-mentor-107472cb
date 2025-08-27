import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, RotateCcw, Home, Target, Timer, Star, CheckCircle, XCircle } from 'lucide-react';
import { GameState, QuestionResult } from '@/types/bigNoiseGame';

interface GameResultsProps {
  gameState: GameState;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export const GameResults: React.FC<GameResultsProps> = ({
  gameState,
  onRestart,
  onBackToMenu
}) => {
  const totalQuestions = 20;
  const correctAnswers = gameState.exactMatches + gameState.labelMatches;
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
  const consecutiveBonus = gameState.maxConsecutive * 5;
  const baseScore = gameState.score - consecutiveBonus;
  
  const completionTime = gameState.startTime && gameState.endTime 
    ? Math.round((gameState.endTime - gameState.startTime) / 1000)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 35) return 'text-green-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResultIcon = (result: QuestionResult) => {
    if (result.type === 'exact') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (result.type === 'label') return <CheckCircle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getResultBadge = (result: QuestionResult) => {
    if (result.type === 'exact') return <Badge className="bg-green-500">+2</Badge>;
    if (result.type === 'label') return <Badge className="bg-yellow-500">+0.5</Badge>;
    return <Badge variant="destructive">0</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Final Score */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6" />
            Partie terminée !
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className={`text-6xl font-bold ${getScoreColor(gameState.score)}`}>
              {gameState.score}
            </div>
            <p className="text-xl text-muted-foreground">points</p>
            
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{gameState.exactMatches}</div>
                <div className="text-sm text-muted-foreground">Réponses exactes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{gameState.labelMatches}</div>
                <div className="text-sm text-muted-foreground">Sélections correctes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{gameState.maxConsecutive}</div>
                <div className="text-sm text-muted-foreground">Série max</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={onRestart} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Rejouer
            </Button>
            <Button onClick={onBackToMenu} variant="outline" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Menu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{accuracy}%</div>
            <div className="text-sm text-muted-foreground">Précision</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{formatTime(completionTime)}</div>
            <div className="text-sm text-muted-foreground">Temps total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{baseScore}</div>
            <div className="text-sm text-muted-foreground">Score de base</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-green-600">+{consecutiveBonus}</div>
            <div className="text-sm text-muted-foreground">Bonus série</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des réponses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {gameState.questionResults.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {getResultIcon(result)}
                  <div>
                    <p className="font-medium">{result.soundName}</p>
                    <p className="text-sm text-muted-foreground">
                      Réponse: "{result.userInput}"
                      {result.selectedLabel && ` → ${result.selectedLabel}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getResultBadge(result)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};