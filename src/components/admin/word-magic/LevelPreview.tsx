import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WordMagicLevel } from '@/types/wordMagicGame';

interface LevelPreviewProps {
  level: WordMagicLevel;
}

export const LevelPreview = ({ level }: LevelPreviewProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'bg-green-100 text-green-800';
      case 'moyen': return 'bg-yellow-100 text-yellow-800';
      case 'difficile': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Niveau {level.level_number}
          </CardTitle>
          <Badge className={getDifficultyColor(level.difficulty)}>
            {level.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grille de lettres */}
        <div>
          <h4 className="font-medium mb-2">Grille:</h4>
          <div className="grid gap-1 p-4 bg-muted rounded-lg max-w-fit">
            {level.grid_layout.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {row.map((cell, cellIndex) => (
                  <div
                    key={`${rowIndex}-${cellIndex}`}
                    className="w-10 h-10 border border-border rounded flex items-center justify-center font-bold text-sm bg-background"
                  >
                    {cell.letter || ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Lettres disponibles */}
        <div>
          <h4 className="font-medium mb-2">Lettres disponibles:</h4>
          <div className="flex flex-wrap gap-1">
            {level.letters.split(',').map((letter, index) => (
              <Badge key={index} variant="outline">
                {letter.trim()}
              </Badge>
            ))}
          </div>
        </div>

        {/* Solutions */}
        <div>
          <h4 className="font-medium mb-2">Solutions ({level.solutions.length}):</h4>
          <div className="flex flex-wrap gap-1">
            {level.solutions.map((solution, index) => (
              <Badge key={index} variant="default">
                {solution}
              </Badge>
            ))}
          </div>
        </div>

        {/* Mots bonus */}
        {level.bonus_words.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Mots bonus ({level.bonus_words.length}):</h4>
            <div className="flex flex-wrap gap-1">
              {level.bonus_words.map((bonus, index) => (
                <Badge key={index} variant="secondary">
                  {bonus}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="text-sm text-muted-foreground">
          <p>Créé le: {new Date(level.created_at).toLocaleDateString()}</p>
          {level.updated_at !== level.created_at && (
            <p>Modifié le: {new Date(level.updated_at).toLocaleDateString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};