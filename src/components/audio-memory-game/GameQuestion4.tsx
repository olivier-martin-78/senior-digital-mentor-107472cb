import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Volume2, Timer, Trash2, CheckCircle } from 'lucide-react';
import { GameSound, SoundInSequence } from '@/types/audioMemoryGame';
import { AudioPlayer } from './AudioPlayer';

interface GameQuestion4Props {
  soundSequence: SoundInSequence[];
  phase4Sounds: GameSound[];
  userSequence: (GameSound | null)[];
  timeLeft: number;
  attempts: number;
  onSoundClick: (soundIndex: number) => void;
  onRemoveSound: (index: number) => void;
  onVerify: () => void;
  score: number;
}

export const GameQuestion4: React.FC<GameQuestion4Props> = ({
  soundSequence,
  phase4Sounds,
  userSequence,
  timeLeft,
  attempts,
  onSoundClick,
  onRemoveSound,
  onVerify,
  score
}) => {
  const getTimeProgress = () => {
    return (timeLeft / 60) * 100;
  };

  const isSequenceComplete = () => {
    return userSequence.every(slot => slot !== null);
  };

  const canVerify = () => {
    return isSequenceComplete() && attempts < 3;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-6 h-6" />
              Phase finale - Séquence inversée
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">1-2 points par son</Badge>
              <Badge variant="secondary">Bonus: 15 + temps</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">
                  Temps restant: {timeLeft}s
                </span>
              </div>
              <div className="text-sm text-yellow-700">
                Tentative {attempts + 1}/3
              </div>
            </div>
            <Progress 
              value={getTimeProgress()} 
              className="h-2 bg-yellow-200"
            />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">
              Reconstituez la séquence dans l'ordre INVERSE
            </h3>
            <p className="text-sm text-muted-foreground">
              Le dernier son doit être placé en premier, l'avant-dernier en deuxième, etc.
            </p>
            <p className="text-xs text-orange-600 font-medium">
              Attention: il y a {phase4Sounds.length / 2} vrais sons et {phase4Sounds.length / 2} faux sons !
            </p>
          </div>

          {/* Séquence utilisateur */}
          <div className="space-y-4">
            <h4 className="font-semibold text-center">Votre séquence (ordre inversé) :</h4>
            <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
              {userSequence.map((sound, index) => (
                <div 
                  key={index}
                  className={`
                    aspect-square border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center
                    ${sound ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 bg-muted/20'}
                  `}
                >
                  {sound ? (
                    <>
                      <div className="text-xs font-bold mb-1">#{index + 1}</div>
                      <div className="text-lg mb-1">🔊</div>
                      <div className="text-xs text-center font-medium">
                        {sound.name}
                      </div>
                      <Button
                        onClick={() => onRemoveSound(index)}
                        size="sm"
                        variant="outline"
                        className="mt-2 h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-bold mb-1">#{index + 1}</div>
                      <div className="text-2xl text-muted-foreground">?</div>
                      <div className="text-xs text-muted-foreground">Vide</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sons disponibles */}
          <div className="space-y-4">
            <h4 className="font-semibold text-center">Sons disponibles :</h4>
            <div className="grid grid-cols-3 gap-3 max-w-4xl mx-auto">
              {phase4Sounds.map((sound, index) => (
                <Card 
                  key={`${sound.id}-${index}`}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onSoundClick(index)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">🔊</div>
                    <div className="text-sm font-medium mb-2">
                      {sound.name}
                    </div>
                    <AudioPlayer
                      ttsText={sound.description}
                      voiceId="9BWtsMINqrJLrRacOk9x"
                      showControls={true}
                      duration={2}
                      className="scale-75"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Bouton de vérification */}
          <div className="text-center">
            <Button
              onClick={onVerify}
              disabled={!canVerify() || timeLeft === 0}
              size="lg"
              className="min-w-48"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Vérifier ma séquence
            </Button>
            
            {!isSequenceComplete() && (
              <p className="text-sm text-orange-600 mt-2">
                Placez tous les sons avant de vérifier
              </p>
            )}
            
            {attempts >= 3 && (
              <p className="text-sm text-red-600 mt-2">
                Nombre maximum de tentatives atteint
              </p>
            )}
          </div>

          {/* Rappel de la séquence originale */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-sm font-medium mb-3 text-center">
              Rappel - Séquence originale (à inverser) :
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {soundSequence.map((item, index) => (
                <div 
                  key={item.sound.id}
                  className="bg-background p-2 rounded flex items-center gap-2 text-xs"
                >
                  <span className="font-bold">{index + 1}.</span>
                  <span>{item.sound.name}</span>
                </div>
              ))}
            </div>
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