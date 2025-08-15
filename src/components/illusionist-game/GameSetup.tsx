import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Eye, Play } from 'lucide-react';
import { GameConfig } from '@/types/illusionistGame';

interface GameSetupProps {
  onStartGame: (config: GameConfig) => void;
}

export const GameSetup = ({ onStartGame }: GameSetupProps) => {
  const [wordDisplayTime, setWordDisplayTime] = useState(2);

  const handleStart = () => {
    onStartGame({
      wordDisplayTime,
      totalWords: 10
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-gradient-to-br from-background to-secondary/10 border-2 border-primary/20">
        <CardHeader className="text-center bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-t-lg">
          <CardTitle className="text-3xl flex items-center justify-center gap-3">
            <Eye className="w-8 h-8" />
            L'Illusionniste
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-2">Comment jouer ?</h3>
              <div className="text-sm text-muted-foreground space-y-2 text-left">
                <p>• Un mot de couleur s'affiche dans une couleur différente</p>
                <p>• Cliquez sur l'étiquette correspondant au MOT (pas à la couleur affichée)</p>
                <p>• 10 mots défilent, puis une question bonus sur le premier mot</p>
                <p>• Concentrez-vous bien, l'illusion peut vous tromper !</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-foreground">Configuration</h4>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Temps d'affichage par mot : {wordDisplayTime} seconde{wordDisplayTime > 1 ? 's' : ''}
                </label>
                <div className="px-4">
                  <Slider
                    value={[wordDisplayTime]}
                    onValueChange={(value) => setWordDisplayTime(value[0])}
                    min={1}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-4">
                  <span>1s (Rapide)</span>
                  <span>5s (Lent)</span>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold py-3 text-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Commencer le jeu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};