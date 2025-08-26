import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { GameSound } from '@/types/audioMemoryGame';
import { AudioPlayer } from './AudioPlayer';
import { getSoundVariant } from '@/data/audioMemoryData';

interface GameQuestion2Props {
  soundSequence: GameSound[];
  availableSounds: GameSound[];
  currentQuestionNumber: number;
  maxQuestions: number;
  usedSoundsInPhase: string[];
  onAnswer: (soundId: string, answer: boolean) => void;
  score: number;
}

export const GameQuestion2: React.FC<GameQuestion2Props> = ({
  soundSequence,
  availableSounds,
  currentQuestionNumber,
  maxQuestions,
  usedSoundsInPhase,
  onAnswer,
  score
}) => {
  const [currentSound, setCurrentSound] = useState<GameSound | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isVariant, setIsVariant] = useState(false);

  useEffect(() => {
    generateQuestion();
  }, [currentQuestionNumber]);

  const generateQuestion = () => {
    setHasAnswered(false);
    
    // Éviter les sons déjà utilisés dans cette phase
    const availableSequenceSounds = soundSequence.filter(s => !usedSoundsInPhase.includes(s.id));
    const availableDecoySounds = availableSounds.filter(
      sound => 
        sound.type === 'original' && 
        !soundSequence.some(s => s.id === sound.id) &&
        !usedSoundsInPhase.includes(sound.id)
    );
    
    // 70% de chance de prendre un variant d'un son de la séquence pour tromper
    // 30% de chance de prendre le son original de la séquence ou un son différent
    const shouldUseVariant = Math.random() < 0.7;
    
    if (shouldUseVariant && availableSequenceSounds.length > 0) {
      // Chercher un variant d'un son de la séquence
      const soundsWithVariants = availableSequenceSounds.filter(sound => {
        const variant = getSoundVariant(sound);
        return variant !== null && !usedSoundsInPhase.includes(variant.id);
      });
      
      if (soundsWithVariants.length > 0) {
        const randomOriginalSound = soundsWithVariants[Math.floor(Math.random() * soundsWithVariants.length)];
        const variant = getSoundVariant(randomOriginalSound);
        
        if (variant && !usedSoundsInPhase.includes(variant.id)) {
          setCurrentSound(variant);
          setIsVariant(true);
          return;
        }
      }
    }
    
    // Fallback : prendre un son original de la séquence ou un son complètement différent
    const shouldUseOriginalSound = Math.random() < 0.5;
    
    if (shouldUseOriginalSound && availableSequenceSounds.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableSequenceSounds.length);
      setCurrentSound(availableSequenceSounds[randomIndex]);
      setIsVariant(false);
    } else if (availableDecoySounds.length > 0) {
      // Son différent de la séquence
      const randomIndex = Math.floor(Math.random() * availableDecoySounds.length);
      setCurrentSound(availableDecoySounds[randomIndex]);
      setIsVariant(false);
    } else {
      // Fallback: utiliser n'importe quel son disponible
      if (availableSequenceSounds.length > 0) {
        setCurrentSound(availableSequenceSounds[0]);
        setIsVariant(false);
      } else if (soundSequence.length > 0) {
        setCurrentSound(soundSequence[0]);
        setIsVariant(false);
      }
    }
  };

  const handleAnswer = (answer: boolean) => {
    if (!currentSound || hasAnswered) return;
    
    setHasAnswered(true);
    onAnswer(currentSound.id, answer);
  };

  if (!currentSound) {
    return <div>Chargement...</div>;
  }

  const wasInSequence = soundSequence.some(s => s.id === currentSound.id);
  const correctAnswer = wasInSequence && !isVariant;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-6 h-6" />
              Question de difficulté 2 ({currentQuestionNumber}/{maxQuestions})
            </CardTitle>
            <Badge variant="outline">2 points</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Attention aux sons similaires mais différents !
              </span>
            </div>
            
            <h3 className="text-xl font-semibold mb-4">
              Ce son était-il exactement dans la séquence ?
            </h3>
            
            <div className="bg-primary/10 p-8 rounded-lg mb-6">
              <div className="text-4xl mb-4">🔊</div>
              <div className="text-xl font-semibold mb-2">
                {currentSound.name}
              </div>
              {isVariant && (
                <div className="text-sm text-orange-600 mb-4">
                  Variante - Écoutez attentivement !
                </div>
              )}
              <div className="text-sm text-muted-foreground mb-4">
                {currentSound.description}
              </div>
              
              <AudioPlayer
                audioUrl={currentSound.file_url}
                ttsText={currentSound.description}
                voiceId="9BWtsMINqrJLrRacOk9x"
                showControls={true}
                duration={4}
              />
            </div>

            {!hasAnswered ? (
              <>
                <div className="text-sm text-muted-foreground mb-4">
                  Écoutez bien : s'agit-il exactement du même son que dans la séquence ?
                </div>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => handleAnswer(true)}
                    size="lg"
                    className="min-w-32"
                    variant="default"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Oui
                  </Button>
                  <Button
                    onClick={() => handleAnswer(false)}
                    size="lg"
                    className="min-w-32"
                    variant="outline"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Non
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  correctAnswer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <div className="font-semibold">
                    {correctAnswer ? 
                      '✅ Ce son était exactement dans la séquence' : 
                      isVariant ? 
                        '❌ Ce son était similaire mais différent (variant)' :
                        '❌ Ce son n\'était pas dans la séquence'
                    }
                  </div>
                  {isVariant && (
                    <div className="text-sm mt-2">
                      C'était une version modifiée (plus aigu/grave, instrument différent, etc.)
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {currentQuestionNumber < maxQuestions ? 'Question suivante...' : 'Passage à la question de difficulté 3...'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Score actuel */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-sm text-muted-foreground">Points actuels</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};