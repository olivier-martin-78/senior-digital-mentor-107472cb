import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImageInSequence } from '@/types/visualMemoryGame';

interface GameDisplayProps {
  imageSequence: ImageInSequence[];
  displayDuration: number; // en secondes
  onFinish: () => void;
}

export const GameDisplay: React.FC<GameDisplayProps> = ({
  imageSequence,
  displayDuration,
  onFinish
}) => {
  const [timeLeft, setTimeLeft] = useState(displayDuration);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalTime = displayDuration * 1000; // en millisecondes
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, totalTime - elapsed);
      
      setTimeLeft(Math.ceil(remaining / 1000));
      setProgress((elapsed / totalTime) * 100);

      if (remaining <= 0) {
        clearInterval(interval);
        onFinish();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [displayDuration, onFinish]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* En-tête avec timer */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">
                📷 Mémorisez cette séquence
              </h2>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">
                  {timeLeft}s
                </div>
                <Progress value={progress} className="w-full max-w-md mx-auto" />
                <p className="text-muted-foreground">
                  Observez attentivement l'ordre et les détails de chaque image
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Séquence d'images */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap justify-center gap-4">
              {imageSequence.map((item, index) => (
                <div
                  key={item.image.id}
                  className="relative group"
                >
                  {/* Position indicator */}
                  <div className="absolute -top-2 -left-2 z-10">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>

                  {/* Image card */}
                  <div className="bg-card border border-border rounded-lg p-6 min-w-[120px] min-h-[120px] flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                    <div className="text-6xl mb-2 transition-transform duration-300 group-hover:scale-110">
                      {item.image.emoji}
                    </div>
                    <div className="text-sm font-medium text-center">
                      {item.image.name}
                    </div>
                  </div>

                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-primary/10 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                <span className="text-sm text-muted-foreground">
                  {imageSequence.length} image{imageSequence.length > 1 ? 's' : ''} à mémoriser
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions pendant l'affichage */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">💡 Conseils pour mémoriser</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>👁️</span>
                  <span>Observez chaque image</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔢</span>
                  <span>Mémorisez l'ordre</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🎨</span>
                  <span>Notez les couleurs</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};