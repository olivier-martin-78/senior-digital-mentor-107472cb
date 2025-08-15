import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Brain, Play, Settings } from 'lucide-react';
import { GameSettings } from '@/types/memoryCountGame';

interface GameSetupProps {
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onStartGame: () => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({
  settings,
  onUpdateSettings,
  onStartGame
}) => {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-br from-purple-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Combien de fois...</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Mémorisez le nombre d'apparitions de chaque image !
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration du jeu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Nombre d'images différentes : {settings.numberOfImages}
            </Label>
            <Slider
              value={[settings.numberOfImages]}
              onValueChange={([value]) => onUpdateSettings({ numberOfImages: value })}
              min={3}
              max={8}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Plus d'images = plus difficile à mémoriser
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">
              Nombre total d'affichages
            </Label>
            <Input
              type="number"
              value={settings.totalDisplays}
              onChange={(e) => onUpdateSettings({ totalDisplays: parseInt(e.target.value) || 15 })}
              min={10}
              max={30}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Nombre total de fois où les images apparaîtront (minimum 10, maximum 30)
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">
              Durée d'affichage par image : {settings.displayDuration}s
            </Label>
            <Slider
              value={[settings.displayDuration]}
              onValueChange={([value]) => onUpdateSettings({ displayDuration: value })}
              min={0.5}
              max={5.0}
              step={0.5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Temps pendant lequel chaque image reste affichée
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-foreground">Récapitulatif :</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {settings.numberOfImages} images différentes</li>
              <li>• {settings.totalDisplays} affichages au total</li>
              <li>• {settings.displayDuration}s par image</li>
              <li>• Durée estimée : {Math.round((settings.totalDisplays * settings.displayDuration) / 60 * 10) / 10} min</li>
            </ul>
          </div>

          <Button 
            onClick={onStartGame} 
            className="w-full py-6 text-lg"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Commencer le jeu
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>💡 Conseil : Commencez avec des paramètres faciles et augmentez progressivement la difficulté !</p>
      </div>
    </div>
  );
};