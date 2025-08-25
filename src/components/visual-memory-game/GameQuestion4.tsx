import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw } from 'lucide-react';
import { GameImage, ImageInSequence } from '@/types/visualMemoryGame';

interface GameQuestion4Props {
  imageSequence: ImageInSequence[];
  phase4Images: GameImage[];
  userSequence: (GameImage | null)[];
  phase4TimeLeft: number;
  phase4Attempts: number;
  onImageClick: (image: GameImage) => void;
  onRemoveImage: (index: number) => void;
  onVerify: () => void;
}

export const GameQuestion4: React.FC<GameQuestion4Props> = ({
  imageSequence,
  phase4Images,
  userSequence,
  phase4TimeLeft,
  phase4Attempts,
  onImageClick,
  onRemoveImage,
  onVerify
}) => {
  const isSequenceComplete = userSequence.every(item => item !== null);
  const originalImages = imageSequence.map(item => item.image);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* En-tête avec timer */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-red-500 text-white">
                Phase 4 - FINALE
              </Badge>
              <Badge variant="outline">
                Bonus possible: jusqu'à 74 points
              </Badge>
            </div>
            <CardTitle className="text-xl">
              🔄 Reconstruisez la séquence dans l'ordre INVERSÉ
            </CardTitle>
            
            {/* Timer */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <Clock className="h-5 w-5" />
              <span className={`text-2xl font-bold ${phase4TimeLeft <= 10 ? 'text-red-500' : 'text-primary'}`}>
                {Math.floor(phase4TimeLeft / 60)}:{(phase4TimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-2">
              <Badge variant="outline">
                Tentative {phase4Attempts + 1}/3
              </Badge>
              {phase4TimeLeft <= 10 && (
                <Badge variant="destructive">
                  ⚠️ Temps limite !
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                La séquence originale était : <strong>1ère → 2ème → 3ème → ... → Dernière</strong>
              </p>
              <p className="text-sm font-medium text-primary">
                Reconstruisez-la inversée : <strong>Dernière → ... → 3ème → 2ème → 1ère</strong>
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Image correcte = 1 point • Bonne position = +1 point • Séquence parfaite = +15 points • Bonus temps = jusqu'à +59 points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zone de construction de la séquence */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Votre séquence inversée</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {userSequence.map((image, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  <div className="absolute -top-2 -left-2 z-10">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>

                  <div
                    className={`w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
                      image 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                    onClick={() => image && onRemoveImage(index)}
                  >
                    {image ? (
                      <>
                        <div className="text-3xl">{image.emoji}</div>
                        <div className="text-xs font-medium mt-1 text-center truncate w-full px-1">
                          {image.name}
                        </div>
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">
                          ×
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 text-xs text-center">
                        Position<br/>{index + 1}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {isSequenceComplete && (
              <div className="text-center">
                <Button 
                  onClick={onVerify}
                  size="lg"
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  ✅ Vérifier ma séquence
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images disponibles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Images disponibles
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              Cliquez sur une image pour l'ajouter à votre séquence • ⚠️ Attention aux pièges !
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {phase4Images.map((image, index) => {
                const isAlreadyUsed = userSequence.some(used => used?.id === image.id);
                
                return (
                  <div
                    key={`${image.id}-${index}`}
                    className={`relative cursor-pointer transition-all ${
                      isAlreadyUsed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                    }`}
                    onClick={() => !isAlreadyUsed && onImageClick(image)}
                  >
                    <div className={`p-3 rounded-lg border-2 text-center ${
                      isAlreadyUsed 
                        ? 'border-muted bg-muted/50' 
                        : 'border-border bg-card hover:border-primary/50'
                    }`}>
                      <div className="text-2xl mb-1">{image.emoji}</div>
                      <div className="text-xs font-medium truncate">{image.name}</div>
                    </div>
                    
                    {isAlreadyUsed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-muted-foreground text-background rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          ✓
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};