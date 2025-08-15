import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import { GameState } from '@/types/illusionistGame';
import { COLORS, shuffleArray } from '@/data/colorWords';

interface GameBonusProps {
  gameState: GameState;
  onAnswerBonus: (answer: string) => void;
}

export const GameBonus = ({ gameState, onAnswerBonus }: GameBonusProps) => {
  if (gameState.phase !== 'bonus') return null;

  // Create options including the correct answer and 3 random others
  const correctAnswer = gameState.firstWord!;
  const otherColors = gameState.availableColors.filter(color => color !== correctAnswer);
  const shuffledOthers = shuffleArray(otherColors).slice(0, 3);
  const allOptions = shuffleArray([correctAnswer, ...shuffledOthers]);

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-gradient-to-br from-background to-accent/10 border-2 border-accent/30">
        <CardHeader className="text-center bg-gradient-to-r from-accent to-accent/80 text-accent-foreground rounded-t-lg">
          <CardTitle className="text-2xl flex items-center justify-center gap-3">
            <Brain className="w-7 h-7" />
            Question Bonus ! 🎯
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-accent/10 rounded-lg p-6 border border-accent/20">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Défi mémoire
              </h3>
              <p className="text-lg text-muted-foreground">
                Quel était le <strong>premier mot de couleur</strong> affiché dans cette partie ?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                (+4 points si vous trouvez la bonne réponse)
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Score actuel : <span className="font-semibold text-foreground">{gameState.score}</span> / 10
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {allOptions.map((color) => (
              <Button
                key={color}
                onClick={() => onAnswerBonus(color)}
                variant="outline"
                className="h-20 text-xl font-semibold border-2 hover:scale-105 transition-transform"
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