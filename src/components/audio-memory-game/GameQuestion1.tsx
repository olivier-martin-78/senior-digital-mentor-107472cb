import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle } from 'lucide-react';
import { GameSound } from '@/types/audioMemoryGame';
import { AudioPlayer } from './AudioPlayer';
import { AUDIO_MEMORY_SOUNDS } from '@/data/audioMemoryData';

interface GameQuestion1Props {
  soundSequence: GameSound[];
  onAnswer: (soundId: string, answer: boolean) => void;
  score: number;
}

export const GameQuestion1: React.FC<GameQuestion1Props> = ({
  soundSequence,
  onAnswer,
  score
}) => {
  const [currentSound, setCurrentSound] = useState<GameSound | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    generateQuestion();
  }, []);

  const generateQuestion = () => {
    setHasAnswered(false);
    
    // 50% de chance de prendre un son de la séquence, 50% un son qui n'y était pas
    const shouldUseOriginalSound = Math.random() < 0.5;
    
    if (shouldUseOriginalSound && soundSequence.length > 0) {
      // Prendre un son aléatoire de la séquence
      const randomIndex = Math.floor(Math.random() * soundSequence.length);
      setCurrentSound(soundSequence[randomIndex]);
    } else {
      // Prendre un son qui n'était pas dans la séquence
      const availableSounds = AUDIO_MEMORY_SOUNDS.filter(
        sound => 
          sound.type === 'original' && 
          !soundSequence.some(s => s.id === sound.id)
      );
      
      if (availableSounds.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableSounds.length);
        setCurrentSound(availableSounds[randomIndex]);
      } else {
        // Fallback si pas de sons disponibles
        setCurrentSound(soundSequence[0]);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-6 h-6" />
              Question de difficulté 1
            </CardTitle>
            <Badge variant="outline">1 point</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">
              Ce son était-il dans la séquence ?
            </h3>
            
            <div className="bg-primary/10 p-8 rounded-lg mb-6">
              <div className="text-4xl mb-4">🔊</div>
              <div className="text-xl font-semibold mb-4">
                {currentSound.name}
              </div>
              
              <AudioPlayer
                audioUrl={currentSound.file_url}
                ttsText={currentSound.description}
                voiceId="9BWtsMINqrJLrRacOk9x"
                showControls={true}
                duration={2}
              />
            </div>

            {!hasAnswered ? (
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
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  wasInSequence ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <div className="font-semibold">
                    {wasInSequence ? '✅ Ce son était dans la séquence' : '❌ Ce son n\'était pas dans la séquence'}
                  </div>
                  {currentSound.description && (
                    <div className="text-sm mt-2">{currentSound.description}</div>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Passage à la question suivante...
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