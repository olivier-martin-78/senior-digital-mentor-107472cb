import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameResult } from '@/types/memoryCountGame';
import { Trophy, RotateCcw, ArrowLeft, Star, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GameResultsProps {
  result: GameResult;
  onPlayAgain: () => void;
}

const getEncouragingMessage = (totalPoints: number, maxPossible: number) => {
  const percentage = (totalPoints / maxPossible) * 100;
  
  if (percentage === 100) {
    return "🎉 Extraordinaire ! Votre mémoire est exceptionnelle !";
  } else if (percentage >= 85) {
    return "🌟 Bravo ! Excellent travail de mémorisation !";
  } else if (percentage >= 65) {
    return "👏 Très bien ! Vous avez une bonne mémoire !";
  } else if (percentage >= 45) {
    return "💪 Bien joué ! Continuez à vous entraîner !";
  } else {
    return "🌱 C'est un bon début ! La pratique améliore la mémoire !";
  }
};

export const GameResults: React.FC<GameResultsProps> = ({
  result,
  onPlayAgain
}) => {
  const maxPossible = result.maxScore + 4; // Questions normales + bonus
  const encouragingMessage = getEncouragingMessage(result.totalPoints, maxPossible);
  const durationMinutes = Math.round(result.duration / 60000 * 10) / 10;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-br from-green-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Résultats</h1>
          <p className="text-xl text-muted-foreground mt-2">
            {encouragingMessage}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Score Final
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {result.totalPoints}
              </div>
              <p className="text-muted-foreground">
                sur {maxPossible} points possibles
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-muted/50 rounded-lg p-3">
                <span className="font-medium">Questions principales</span>
                <span className="text-lg font-bold text-foreground">
                  {result.score}/{result.maxScore}
                </span>
              </div>
              <div className="flex justify-between items-center bg-muted/50 rounded-lg p-3">
                <span className="font-medium flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Question bonus
                </span>
                <span className={`text-lg font-bold ${result.bonusCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {result.bonusCorrect ? '✓ +4' : '✗ +0'}
                </span>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Durée : {durationMinutes} minute{durationMinutes !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détail des réponses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {result.questions.map((question, index) => (
                <div key={question.imageId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    {question.correct ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">Question {index + 1}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Votre réponse : {question.userAnswer} | Correct : {question.correctCount}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Configuration utilisée
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-background/50 rounded-lg p-3">
                <div className="font-medium text-foreground">{result.settings.numberOfImages}</div>
                <div className="text-muted-foreground">Images différentes</div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <div className="font-medium text-foreground">{result.settings.totalDisplays}</div>
                <div className="text-muted-foreground">Affichages total</div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <div className="font-medium text-foreground">{result.settings.displayDuration}s</div>
                <div className="text-muted-foreground">Par image</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onPlayAgain} size="lg" className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5" />
          Rejouer
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/activities/games" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Retour aux jeux
          </Link>
        </Button>
      </div>
    </div>
  );
};