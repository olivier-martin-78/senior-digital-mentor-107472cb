import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GameImage, ImageSequence } from '@/types/memoryCountGame';
import { Eye } from 'lucide-react';

interface GamePlayProps {
  imageSequence: ImageSequence[];
  displayDuration: number;
  onFinish: () => void;
}

export const GamePlay: React.FC<GamePlayProps> = ({
  imageSequence,
  displayDuration,
  onFinish
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const currentImage = imageSequence[currentIndex]?.image;
  const progress = ((currentIndex + 1) / imageSequence.length) * 100;

  // Countdown before starting
  useEffect(() => {
    if (!isStarted && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!isStarted && countdown === 0) {
      setIsStarted(true);
    }
  }, [countdown, isStarted]);

  // Game progression
  useEffect(() => {
    if (!isStarted) return;

    if (currentIndex >= imageSequence.length) {
      onFinish();
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, displayDuration * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, isStarted, displayDuration, imageSequence.length, onFinish]);

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-12 text-center">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Eye className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Préparez-vous !
              </h2>
              <p className="text-muted-foreground">
                Mémorisez bien le nombre de fois que chaque image apparaît
              </p>
            </div>
            <div className="text-6xl font-bold text-primary">
              {countdown > 0 ? countdown : 'GO !'}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (currentIndex >= imageSequence.length) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Défilement terminé !
            </h2>
            <p className="text-muted-foreground">
              Préparation des questions...
            </p>
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Image {currentIndex + 1} sur {imageSequence.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <Card className="aspect-square flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="text-center animate-in fade-in duration-300">
          <div className="text-8xl mb-4">
            {currentImage?.emoji}
          </div>
          <p className="text-xl font-medium text-foreground">
            {currentImage?.name}
          </p>
        </div>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          💭 Comptez mentalement le nombre d'apparitions de chaque image
        </p>
      </div>
    </div>
  );
};