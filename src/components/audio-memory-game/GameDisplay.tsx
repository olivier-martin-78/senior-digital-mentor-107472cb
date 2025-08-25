import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, Play } from 'lucide-react';
import { SoundInSequence } from '@/types/audioMemoryGame';
import { AudioPlayer } from './AudioPlayer';

interface GameDisplayProps {
  soundSequence: SoundInSequence[];
  onFinishDisplay: () => void;
}

export const GameDisplay: React.FC<GameDisplayProps> = ({
  soundSequence,
  onFinishDisplay
}) => {
  const [currentRepetition, setCurrentRepetition] = useState(1);
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<'countdown' | 'playing' | 'finished'>('countdown');

  // Countdown avant de commencer
  useEffect(() => {
    if (phase === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setPhase('playing');
        setIsPlaying(true);
      }
    }
  }, [countdown, phase]);

  // Gestion de la lecture des sons
  useEffect(() => {
    if (phase !== 'playing' || !isPlaying) return;

    const currentSound = soundSequence[currentSoundIndex];
    if (!currentSound) return;

    // Jouer le son pendant 2 secondes puis passer au suivant
    const timer = setTimeout(() => {
      if (currentSoundIndex < soundSequence.length - 1) {
        // Son suivant dans la séquence
        setCurrentSoundIndex(currentSoundIndex + 1);
      } else {
        // Fin de la séquence
        if (currentRepetition < 4) {
          // Répétition suivante
          setCurrentRepetition(currentRepetition + 1);
          setCurrentSoundIndex(0);
          setIsPlaying(false);
          
          // Petite pause entre les répétitions
          setTimeout(() => setIsPlaying(true), 1000);
        } else {
          // Fin de toutes les répétitions
          setPhase('finished');
          setTimeout(onFinishDisplay, 2000);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentSoundIndex, currentRepetition, isPlaying, phase, soundSequence, onFinishDisplay]);

  const getCurrentSound = () => {
    return soundSequence[currentSoundIndex];
  };

  const getProgress = () => {
    const totalSounds = soundSequence.length * 4; // 4 répétitions
    const completedSounds = (currentRepetition - 1) * soundSequence.length + currentSoundIndex;
    return (completedSounds / totalSounds) * 100;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <Volume2 className="w-6 h-6" />
            Mémorisation de la séquence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {phase === 'countdown' && (
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-primary animate-pulse">
                {countdown || 'GO!'}
              </div>
              <p className="text-lg text-muted-foreground">
                Préparez-vous à écouter la séquence...
              </p>
            </div>
          )}

          {phase === 'playing' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">
                  Répétition {currentRepetition} / 4
                </div>
                <div className="text-lg text-muted-foreground">
                  Son {currentSoundIndex + 1} / {soundSequence.length}
                </div>
              </div>

              <Progress value={getProgress()} className="w-full h-3" />

              {/* Affichage du son actuel */}
              <div className="bg-primary/10 p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">🔊</div>
                <div className="text-xl font-semibold mb-2">
                  {getCurrentSound()?.sound.name}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Position {currentSoundIndex + 1}
                </div>
                
                {/* Lecteur audio automatique */}
                <AudioPlayer
                  audioUrl={getCurrentSound()?.sound.file_url || ''}
                  autoPlay={isPlaying}
                  showControls={false}
                  duration={2}
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Chaque son est joué pendant 2 secondes. Concentrez-vous sur l'ordre !
              </div>
            </div>
          )}

          {phase === 'finished' && (
            <div className="text-center space-y-4">
              <div className="text-4xl mb-4">✅</div>
              <div className="text-2xl font-bold">Séquence terminée !</div>
              <div className="text-lg text-muted-foreground">
                Les questions vont maintenant commencer...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations sur le jeu */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{soundSequence.length}</div>
              <div className="text-sm text-muted-foreground">Sons à mémoriser</div>
            </div>
            <div>
              <div className="text-2xl font-bold">4</div>
              <div className="text-sm text-muted-foreground">Répétitions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};