import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameImage } from '@/types/memoryCountGame';
import { Star, Trophy } from 'lucide-react';

interface GameBonusProps {
  selectedImages: GameImage[];
  bonusQuestion: {
    type: 'first' | 'last';
    correctAnswer: string;
  };
  onAnswer: (imageId: string) => void;
}

export const GameBonus: React.FC<GameBonusProps> = ({
  selectedImages,
  bonusQuestion,
  onAnswer
}) => {
  const questionText = bonusQuestion.type === 'first' 
    ? 'Quelle image a été affichée EN PREMIER ?' 
    : 'Quelle image a été affichée EN DERNIER ?';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Question Bonus
            <Star className="w-6 h-6 text-yellow-500" />
          </h2>
          <p className="text-muted-foreground">
            Rapporte 4 points supplémentaires !
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">
            {questionText}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Cliquez sur l'image que vous pensez être la bonne réponse
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedImages.map((image) => (
              <Button
                key={image.id}
                onClick={() => onAnswer(image.id)}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
              >
                <span className="text-3xl">{image.emoji}</span>
                <span className="text-sm font-medium">{image.name}</span>
              </Button>
            ))}
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <Star className="w-5 h-5" />
              <span className="font-semibold">Conseil :</span>
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              Essayez de vous rappeler {bonusQuestion.type === 'first' ? 'la toute première' : 'la toute dernière'} image que vous avez vue !
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};