import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye } from 'lucide-react';
import { GameState } from '@/types/illusionistGame';
import { COLORS } from '@/data/colorWords';

interface GamePlayProps {
  gameState: GameState;
  timeLeft: number;
  onSelectAnswer: (color: string) => void;
}

export const GamePlay = ({ gameState, timeLeft, onSelectAnswer }: GamePlayProps) => {
  if (gameState.phase !== 'playing') return null;

  const currentWord = gameState.words[gameState.currentWordIndex];
  const progress = ((gameState.currentWordIndex + 1) / gameState.words.length) * 100;
  const timeProgress = (timeLeft / gameState.config.wordDisplayTime) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-gradient-to-br from-background to-secondary/10 border-2 border-primary/20">
        <CardHeader className="text-center bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-t-lg">
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            <Eye className="w-6 h-6" />
            Question {gameState.currentWordIndex + 1} / {gameState.words.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Progress bars */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progression</span>
              <span>Score: {gameState.score}</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Temps restant</span>
              <span>{Math.ceil(timeLeft)}s</span>
            </div>
            <Progress 
              value={timeProgress} 
              className="h-1"
              style={{
                background: timeProgress < 30 ? 'hsl(var(--destructive))' : 'hsl(var(--muted))'
              }}
            />
          </div>

          {/* Current word display */}
          <div className="text-center py-8">
            <div className="bg-muted/30 rounded-xl p-8 border-2 border-border shadow-lg">
              <p className="text-sm text-muted-foreground mb-2">Quel est ce mot ?</p>
              <div 
                className="text-8xl font-bold mb-4"
                style={{ color: COLORS[currentWord.color] }}
              >
                {currentWord.word}
              </div>
              <p className="text-sm text-muted-foreground">
                Cliquez sur le mot correspondant (pas la couleur affichée)
              </p>
            </div>
          </div>

          {/* Color options */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {gameState.availableColors.map((color) => (
              <Button
                key={color}
                onClick={() => onSelectAnswer(color)}
                variant="outline"
                className="h-16 text-lg font-semibold border-2 hover:scale-105 transition-transform"
                style={{
                  backgroundColor: COLORS[color],
                  color: color === 'Blanc' || color === 'Jaune' ? '#000000' : '#ffffff',
                  borderColor: 'hsl(var(--border))'
                }}
              >
                {color}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};