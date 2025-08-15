import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GameImage } from '@/types/memoryCountGame';
import { HelpCircle } from 'lucide-react';

interface GameQuestionsProps {
  selectedImages: GameImage[];
  currentQuestionIndex: number;
  onAnswer: (imageId: string, answer: number) => void;
}

const ANSWER_OPTIONS = [
  { value: 0, label: '0 fois' },
  { value: 1, label: '1 fois' },
  { value: 2, label: '2 fois' },
  { value: 3, label: '3 fois' },
  { value: 4, label: '4 fois' },
  { value: 5, label: '5 fois' }
];

export const GameQuestions: React.FC<GameQuestionsProps> = ({
  selectedImages,
  currentQuestionIndex,
  onAnswer
}) => {
  const currentImage = selectedImages[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / selectedImages.length) * 100;

  if (!currentImage) {
    return <div>Chargement...</div>;
  }

  const handleAnswer = (answer: number) => {
    onAnswer(currentImage.id, answer);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} sur {selectedImages.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center justify-center">
            <HelpCircle className="w-6 h-6" />
            Combien de fois cette image est apparue ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center">
            <div className="text-8xl mb-4">
              {currentImage.emoji}
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {currentImage.name}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {ANSWER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                variant="outline"
                className="py-6 text-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                size="lg"
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              🤔 Réfléchissez bien avant de répondre
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};