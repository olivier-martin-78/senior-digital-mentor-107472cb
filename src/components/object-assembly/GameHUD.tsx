import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, AlertCircle, Lightbulb } from 'lucide-react';

interface GameHUDProps {
  score: number;
  level: number;
  errors: number;
  hintsUsed: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  level,
  errors,
  hintsUsed
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Score */}
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-medium">Score :</span>
            <Badge variant="default" className="text-lg px-3 py-1">
              {score}
            </Badge>
          </div>

          {/* Level */}
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Niveau :</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {level}
            </Badge>
          </div>

          {/* Errors */}
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-5 w-5 ${errors > 3 ? 'text-red-500' : 'text-muted-foreground'}`} />
            <span className="font-medium">Erreurs :</span>
            <Badge 
              variant={errors > 3 ? "destructive" : "secondary"} 
              className="text-lg px-3 py-1"
            >
              {errors}
            </Badge>
          </div>

          {/* Hints Used */}
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <span className="font-medium">Indices :</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {hintsUsed}
            </Badge>
          </div>
        </div>

        {/* Adaptation Warning */}
        {errors > 3 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-800 text-sm text-center">
              💡 Mode d'aide activé : Le jeu s'adapte pour vous aider à réussir
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};