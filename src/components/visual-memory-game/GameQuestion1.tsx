import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { GameImage, ImageInSequence } from '@/types/visualMemoryGame';
import { generateDecoyImages } from '@/data/visualMemoryImages';

interface GameQuestion1Props {
  imageSequence: ImageInSequence[];
  currentQuestionIndex: number;
  onAnswer: (answer: boolean, imageShown: GameImage, isCorrect: boolean) => void;
}

export const GameQuestion1: React.FC<GameQuestion1Props> = ({
  imageSequence,
  currentQuestionIndex,
  onAnswer
}) => {
  const [currentImage, setCurrentImage] = useState<GameImage | null>(null);
  const [wasInSequence, setWasInSequence] = useState<boolean>(false);
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    generateQuestion();
  }, [currentQuestionIndex, imageSequence]);

  const generateQuestion = () => {
    setAnswered(false);
    setShowExplanation(false);
    
    // 50% de chance de montrer une image de la séquence
    const showFromSequence = Math.random() > 0.5;
    
    if (showFromSequence && imageSequence.length > 0) {
      // Montrer une image de la séquence
      const randomIndex = Math.floor(Math.random() * imageSequence.length);
      setCurrentImage(imageSequence[randomIndex].image);
      setWasInSequence(true);
    } else {
      // Montrer une image qui n'était PAS dans la séquence
      const sequenceImages = imageSequence.map(item => item.image);
      const decoyImages = generateDecoyImages(sequenceImages, 1);
      if (decoyImages.length > 0) {
        setCurrentImage(decoyImages[0]);
        setWasInSequence(false);
      }
    }
  };

  const handleAnswer = (userAnswer: boolean) => {
    if (answered || !currentImage) return;
    
    setAnswered(true);
    const isCorrect = userAnswer === wasInSequence;
    
    setShowExplanation(true);
    
    // Passer la réponse au parent après un délai pour montrer l'explication
    setTimeout(() => {
      onAnswer(userAnswer, currentImage, isCorrect);
    }, 2000);
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
              <Badge variant="secondary" className="bg-blue-500 text-white">
                Phase 1
              </Badge>
              <Badge variant="outline">
                1 point par bonne réponse
              </Badge>
            </div>
            <CardTitle className="text-xl">
              🤔 Cette image était-elle dans la séquence ?
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Image à examiner */}
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="bg-card border border-border rounded-lg p-8 inline-block shadow-lg">
                <div className="text-8xl mb-4">
                  {currentImage.emoji}
                </div>
                <div className="text-lg font-medium">
                  {currentImage.name}
                </div>
              </div>
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
                  OUI
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleAnswer(false)}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-4"
                >
                  <X className="w-5 h-5 mr-2" />
                  NON
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Explication */}
        {showExplanation && (
          <Card className={`border-2 ${wasInSequence ? 'border-green-500' : 'border-red-500'}`}>
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="text-lg font-semibold">
                  {wasInSequence ? (
                    <span className="text-green-600">✅ Cette image ÉTAIT dans la séquence</span>
                  ) : (
                    <span className="text-red-600">❌ Cette image N'ÉTAIT PAS dans la séquence</span>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {wasInSequence 
                    ? "L'image " + currentImage.name + " faisait bien partie des images montrées."
                    : "L'image " + currentImage.name + " était un piège - elle n'était pas dans la série originale."
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