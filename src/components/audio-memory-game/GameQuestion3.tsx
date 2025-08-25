import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2 } from 'lucide-react';
import { SoundInSequence } from '@/types/audioMemoryGame';
import { AudioPlayer } from './AudioPlayer';

interface GameQuestion3Props {
  soundSequence: SoundInSequence[];
  onAnswer: (soundId: string, position: number) => void;
  score: number;
}

export const GameQuestion3: React.FC<GameQuestion3Props> = ({
  soundSequence,
  onAnswer,
  score
}) => {
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  useEffect(() => {
    generateQuestion();
  }, []);

  const generateQuestion = () => {
    setHasAnswered(false);
    setSelectedPosition(null);
    
    // Prendre un son aléatoire de la séquence
    const randomIndex = Math.floor(Math.random() * soundSequence.length);
    setCurrentSoundIndex(randomIndex);
  };

  const handleAnswer = (position: number) => {
    const currentSound = soundSequence[currentSoundIndex];
    if (!currentSound || hasAnswered) return;
    
    setSelectedPosition(position);
    setHasAnswered(true);
    onAnswer(currentSound.sound.id, position);
  };

  const currentSound = soundSequence[currentSoundIndex];
  const correctPosition = currentSound.position + 1; // +1 car l'affichage commence à 1

  if (!currentSound) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-6 h-6" />
              Question de difficulté 3
            </CardTitle>
            <Badge variant="outline">3 points</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">
              À quelle position était ce son dans la séquence ?
            </h3>
            
            <div className="bg-primary/10 p-8 rounded-lg mb-6">
              <div className="text-4xl mb-4">🔊</div>
              <div className="text-xl font-semibold mb-2">
                {currentSound.sound.name}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                {currentSound.sound.description}
              </div>
              
              <AudioPlayer
                audioUrl={currentSound.sound.file_url}
                ttsText={currentSound.sound.description}
                voiceId="9BWtsMINqrJLrRacOk9x"
                showControls={true}
                duration={4}
              />
            </div>

            {!hasAnswered ? (
              <>
                <div className="text-sm text-muted-foreground mb-4">
                  Cliquez sur la position où ce son apparaissait dans la séquence :
                </div>
                <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                  {Array.from({ length: soundSequence.length }, (_, index) => (
                    <Button
                      key={index + 1}
                      onClick={() => handleAnswer(index + 1)}
                      size="lg"
                      variant="outline"
                      className="aspect-square text-lg font-bold"
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  selectedPosition === correctPosition ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <div className="font-semibold">
                    {selectedPosition === correctPosition ? 
                      `✅ Correct ! Ce son était en position ${correctPosition}` : 
                      `❌ Incorrect. Ce son était en position ${correctPosition}, pas ${selectedPosition}`
                    }
                  </div>
                </div>

                {/* Afficher la séquence complète pour rappel */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm font-medium mb-3">Rappel de la séquence :</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {soundSequence.map((item, index) => (
                      <div 
                        key={item.sound.id}
                        className={`p-2 rounded flex items-center gap-2 ${
                          index === currentSoundIndex ? 'bg-primary/20 font-semibold' : 'bg-background'
                        }`}
                      >
                        <span className="font-bold">{index + 1}.</span>
                        <span>{item.sound.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Passage à la phase finale...
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