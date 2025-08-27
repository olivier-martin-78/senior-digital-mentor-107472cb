import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Volume2, Target, Timer, ArrowRight } from 'lucide-react';
import { GameState, GameSound } from '@/types/bigNoiseGame';

interface GamePlayProps {
  gameState: GameState;
  onPlaySound: () => void;
  onSubmitInput: (input: string) => void;
  onSelectLabel: (sound: GameSound) => void;
  onInputChange: (input: string) => void;
}

export const GamePlay: React.FC<GamePlayProps> = ({
  gameState,
  onPlaySound,
  onSubmitInput,
  onSelectLabel,
  onInputChange
}) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(gameState.userInput);
  }, [gameState.userInput]);

  useEffect(() => {
    if (gameState.phase === 'playing' && gameState.currentSound) {
      // Auto-play sound when phase changes to playing
      const timer = setTimeout(() => {
        onPlaySound();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.currentSound, onPlaySound]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmitInput(inputValue.trim());
      setInputValue('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onInputChange(value);
  };

  const renderPlayingPhase = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Son {gameState.currentSoundIndex + 1} / 20
          </CardTitle>
          <Badge variant="secondary">{gameState.score} points</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Volume2 className="w-16 h-16 text-primary" />
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium">Écoutez attentivement...</p>
            <Progress value={gameState.audioProgress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground">
              Le son va être joué automatiquement
            </p>
          </div>

          {gameState.audioProgress < 100 && (
            <Button 
              onClick={onPlaySound}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Rejouer le son
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderInputPhase = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Quelle était ce son ?
          </CardTitle>
          <Badge variant="secondary">{gameState.score} points</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <p className="text-lg">Saisissez un mot-clé qui décrit le son que vous venez d'entendre</p>
          
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Ex: chien, piano, orage..."
              className="text-center text-lg"
              autoFocus
            />
            
            <div className="flex gap-2">
              <Button 
                type="button"
                onClick={onPlaySound}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Rejouer
              </Button>
              
              <Button 
                type="submit" 
                disabled={!inputValue.trim()}
                className="flex-1 flex items-center gap-2"
              >
                Valider <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 Si votre réponse correspond exactement, vous gagnez 2 points. 
              Sinon, vous pourrez choisir parmi une liste d'options pour 0,5 point.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSelectionPhase = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Choisissez la bonne réponse
          </CardTitle>
          <Badge variant="secondary">{gameState.score} points</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-medium">Votre réponse : "{gameState.userInput}"</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ce n'était pas exact. Choisissez parmi les options ci-dessous :
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gameState.sounds.map((sound) => (
              <Button
                key={sound.id}
                onClick={() => onSelectLabel(sound)}
                variant="outline"
                className="h-auto p-4 text-center break-words"
              >
                {sound.name}
              </Button>
            ))}
          </div>

          <Button 
            onClick={onPlaySound}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Rejouer le son
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Stats bar
  const statsBar = (
    <div className="flex items-center justify-center gap-6 p-4 bg-muted/30 rounded-lg">
      <div className="text-center">
        <p className="font-bold text-lg">{gameState.score}</p>
        <p className="text-xs text-muted-foreground">Points</p>
      </div>
      <div className="text-center">
        <p className="font-bold text-lg">{gameState.exactMatches}</p>
        <p className="text-xs text-muted-foreground">Exacts</p>
      </div>
      <div className="text-center">
        <p className="font-bold text-lg">{gameState.labelMatches}</p>
        <p className="text-xs text-muted-foreground">Sélections</p>
      </div>
      <div className="text-center">
        <p className="font-bold text-lg">{gameState.consecutiveCorrect}</p>
        <p className="text-xs text-muted-foreground">Consécutifs</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {statsBar}
      
      {gameState.phase === 'playing' && renderPlayingPhase()}
      {gameState.phase === 'input' && renderInputPhase()}
      {gameState.phase === 'selection' && renderSelectionPhase()}
    </div>
  );
};