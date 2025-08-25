import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { GameImage, ImageInSequence } from '@/types/visualMemoryGame';
import { getImageVariant } from '@/data/visualMemoryImages';

interface GameQuestion2Props {
  imageSequence: ImageInSequence[];
  currentQuestionIndex: number;
  onAnswer: (answer: boolean, imageShown: GameImage, isCorrect: boolean) => void;
}

export const GameQuestion2: React.FC<GameQuestion2Props> = ({
  imageSequence,
  currentQuestionIndex,
  onAnswer
}) => {
  const [currentImage, setCurrentImage] = useState<GameImage | null>(null);
  const [displayedEmoji, setDisplayedEmoji] = useState<string>('');
  const [wasCorrectColor, setWasCorrectColor] = useState<boolean>(false);
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    generateQuestion();
  }, [currentQuestionIndex, imageSequence]);

  const generateQuestion = () => {
    setAnswered(false);
    setShowExplanation(false);
    
    if (imageSequence.length === 0) return;
    
    // Sélectionner une image de la séquence
    const randomIndex = Math.floor(Math.random() * imageSequence.length);
    const originalImage = imageSequence[randomIndex].image;
    setCurrentImage(originalImage);
    
    // 50% de chance de montrer la bonne couleur
    const showCorrectColor = Math.random() > 0.5;
    
    if (showCorrectColor) {
      // Montrer l'image avec sa couleur originale
      setDisplayedEmoji(originalImage.emoji);
      setWasCorrectColor(true);
    } else {
      // Montrer l'image avec une couleur différente (variante)
      const variant = getImageVariant(originalImage);
      setDisplayedEmoji(variant || originalImage.emoji);
      setWasCorrectColor(false);
    }
  };

  const handleAnswer = (userAnswer: boolean) => {
    if (answered || !currentImage) return;
    
    setAnswered(true);
    const isCorrect = userAnswer === wasCorrectColor;
    
    setShowExplanation(true);
    
    // Passer la réponse au parent après un délai pour montrer l'explication
    setTimeout(() => {
      onAnswer(userAnswer, currentImage, isCorrect);
    }, 2500);
  };

  if (!currentImage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* En-tête */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-orange-500 text-white">
                Phase 2
              </Badge>
              <Badge variant="outline">
                2 points par bonne réponse
              </Badge>
            </div>
            <CardTitle className="text-xl">
              🎨 Cette image a-t-elle la même couleur que dans la séquence ?
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Image à examiner */}
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="bg-card border border-border rounded-lg p-8 inline-block shadow-lg">
                <div className="text-8xl mb-4">
                  {displayedEmoji}
                </div>
                <div className="text-lg font-medium">
                  {currentImage.name}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Comparez cette image avec celle que vous avez vue dans la séquence originale. 
                La couleur est-elle identique ?
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Boutons de réponse */}
        {!answered ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => handleAnswer(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4"
                >
                  <Check className="w-5 h-5 mr-2" />
                  OUI - Même couleur
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleAnswer(false)}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-4"
                >
                  <X className="w-5 h-5 mr-2" />
                  NON - Couleur différente
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Explication */}
        {showExplanation && (
          <Card className={`border-2 ${wasCorrectColor ? 'border-green-500' : 'border-orange-500'}`}>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-lg font-semibold">
                  {wasCorrectColor ? (
                    <span className="text-green-600">✅ Couleur IDENTIQUE à l'originale</span>
                  ) : (
                    <span className="text-orange-600">⚠️ Couleur DIFFÉRENTE de l'originale</span>
                  )}
                </div>
                
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">{currentImage.emoji}</div>
                    <p className="text-xs text-muted-foreground">Original</p>
                  </div>
                  <div className="text-2xl">→</div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">{displayedEmoji}</div>
                    <p className="text-xs text-muted-foreground">Affiché</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm">
                  {wasCorrectColor 
                    ? "Cette image avait exactement la même couleur que dans la séquence originale."
                    : "Cette image était une variante avec une couleur différente pour vous tromper !"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress indicator */}
        <div className="text-center">
          <Badge variant="outline">
            Question {currentQuestionIndex + 1}
          </Badge>
        </div>
      </div>
    </div>
  );
};