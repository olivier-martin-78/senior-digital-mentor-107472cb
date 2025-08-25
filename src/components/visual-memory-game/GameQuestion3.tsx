import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageInSequence } from '@/types/visualMemoryGame';

interface GameQuestion3Props {
  imageSequence: ImageInSequence[];
  currentQuestionIndex: number;
  onAnswer: (position: number, imageShown: any, correctPosition: number) => void;
}

export const GameQuestion3: React.FC<GameQuestion3Props> = ({
  imageSequence,
  currentQuestionIndex,
  onAnswer
}) => {
  const [currentImageData, setCurrentImageData] = useState<ImageInSequence | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  useEffect(() => {
    generateQuestion();
  }, [currentQuestionIndex, imageSequence]);

  const generateQuestion = () => {
    setAnswered(false);
    setShowExplanation(false);
    setSelectedPosition(null);
    
    if (imageSequence.length === 0) return;
    
    // Sélectionner une image de la séquence
    const randomIndex = Math.floor(Math.random() * imageSequence.length);
    setCurrentImageData(imageSequence[randomIndex]);
  };

  const handleAnswer = (userPosition: number) => {
    if (answered || !currentImageData) return;
    
    setAnswered(true);
    setSelectedPosition(userPosition);
    const correctPosition = currentImageData.position + 1; // +1 car on affiche de 1 à N
    
    setShowExplanation(true);
    
    // Passer la réponse au parent après un délai pour montrer l'explication
    setTimeout(() => {
      onAnswer(userPosition, currentImageData.image, correctPosition);
    }, 3000);
  };

  if (!currentImageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const correctPosition = currentImageData.position + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* En-tête */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-purple-500 text-white">
                Phase 3
              </Badge>
              <Badge variant="outline">
                3 points par bonne réponse
              </Badge>
            </div>
            <CardTitle className="text-xl">
              📍 À quelle position était cette image dans la séquence ?
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Image à localiser */}
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="bg-card border border-border rounded-lg p-8 inline-block shadow-lg">
                <div className="text-8xl mb-4">
                  {currentImageData.image.emoji}
                </div>
                <div className="text-lg font-medium">
                  {currentImageData.image.name}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                Cliquez sur la position où se trouvait cette image dans la séquence originale
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Boutons de position */}
        {!answered ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3 justify-center">
                {Array.from({ length: imageSequence.length }, (_, index) => {
                  const position = index + 1;
                  return (
                    <Button
                      key={position}
                      size="lg"
                      onClick={() => handleAnswer(position)}
                      className="w-16 h-16 text-xl font-bold"
                      variant="outline"
                    >
                      {position}
                    </Button>
                  );
                })}
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Position 1 = première image, Position {imageSequence.length} = dernière image
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Explication */}
        {showExplanation && (
          <Card className={`border-2 ${selectedPosition === correctPosition ? 'border-green-500' : 'border-red-500'}`}>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-lg font-semibold">
                  {selectedPosition === correctPosition ? (
                    <span className="text-green-600">✅ Position CORRECTE !</span>
                  ) : (
                    <span className="text-red-600">❌ Position INCORRECTE</span>
                  )}
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-muted-foreground mb-1">Votre réponse</div>
                    <div className={`text-4xl font-bold p-4 rounded-lg ${
                      selectedPosition === correctPosition ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {selectedPosition}
                    </div>
                  </div>
                  
                  {selectedPosition !== correctPosition && (
                    <>
                      <div className="text-2xl">→</div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-muted-foreground mb-1">Bonne réponse</div>
                        <div className="text-4xl font-bold p-4 rounded-lg bg-green-100 text-green-600">
                          {correctPosition}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <p className="text-muted-foreground text-sm">
                  L'image "{currentImageData.image.name}" était en position {correctPosition} dans la séquence originale.
                </p>

                {/* Aperçu de la séquence */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-3">Rappel de la séquence :</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {imageSequence.map((item, index) => (
                      <div
                        key={item.image.id}
                        className={`flex flex-col items-center p-2 rounded ${
                          index + 1 === correctPosition ? 'bg-green-200' : 'bg-muted'
                        }`}
                      >
                        <div className="text-lg">{item.image.emoji}</div>
                        <div className="text-xs font-bold">{index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress indicator */}
        <div className="text-center">
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} / {imageSequence.length}
          </Badge>
        </div>
      </div>
    </div>
  );
};