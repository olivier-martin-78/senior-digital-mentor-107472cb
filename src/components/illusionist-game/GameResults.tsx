import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GameResult } from '@/types/illusionistGame';

interface GameResultsProps {
  result: GameResult;
  onRestart: () => void;
  onBackToSetup: () => void;
}

export const GameResults = ({ result, onRestart, onBackToSetup }: GameResultsProps) => {
  const getResultMessage = () => {
    const percentage = (result.totalScore / result.maxScore) * 100;
    
    if (percentage >= 85) return 'Extraordinaire ! Votre concentration est remarquable ! 🏆';
    if (percentage >= 70) return 'Excellent ! Vous maîtrisez parfaitement l\'exercice ! 🌟';
    if (percentage >= 50) return 'Très bien ! Votre attention est de qualité ! 👏';
    if (percentage >= 30) return 'Bien joué ! Continuez à vous entraîner ! 💪';
    return 'Bon début ! L\'entraînement vous aidera à progresser ! 🎯';
  };

  const getResultEmoji = () => {
    const percentage = (result.totalScore / result.maxScore) * 100;
    
    if (percentage >= 85) return '🎉';
    if (percentage >= 70) return '😊';
    if (percentage >= 50) return '🙂';
    if (percentage >= 30) return '😌';
    return '🤔';
  };

  const getResultColors = () => {
    const percentage = (result.totalScore / result.maxScore) * 100;
    
    if (percentage >= 85) return 'from-yellow-200 to-orange-200 border-yellow-400';
    if (percentage >= 70) return 'from-green-200 to-emerald-200 border-green-400';
    if (percentage >= 50) return 'from-blue-200 to-cyan-200 border-blue-400';
    if (percentage >= 30) return 'from-purple-200 to-violet-200 border-purple-400';
    return 'from-gray-200 to-gray-300 border-gray-400';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className={`bg-gradient-to-br ${getResultColors()} border-2`}>
        <CardHeader className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-t-lg">
          <CardTitle className="text-3xl text-center">
            🎭 Partie terminée !
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">
              {getResultEmoji()}
            </div>
            
            <div className="bg-background/80 rounded-lg p-6 border-2 border-border mb-6 space-y-4">
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">
                  Score final : {result.totalScore} / {result.maxScore}
                </p>
                <div className="text-lg font-medium rounded-full px-4 py-2 inline-block bg-muted text-muted-foreground">
                  {Math.round((result.totalScore / result.maxScore) * 100)}%
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium text-foreground">Mots corrects</p>
                  <p className="text-2xl font-bold text-primary">{result.correctAnswers}/10</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium text-foreground">Question bonus</p>
                  <p className="text-2xl font-bold text-secondary">
                    {result.bonusCorrect ? '✓ +4' : '✗ +0'}
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-lg text-foreground font-medium mb-6">
              {getResultMessage()}
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={onRestart}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold py-3 text-lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Rejouer
            </Button>
            
            <Button 
              onClick={onBackToSetup}
              variant="outline" 
              className="w-full border-2 border-border hover:bg-muted text-foreground font-medium py-3 text-lg"
            >
              Modifier les paramètres
            </Button>
            
            <Link to="/activities/games">
              <Button 
                variant="outline" 
                className="w-full border-2 border-border hover:bg-muted text-foreground font-medium py-3 text-lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Retour aux jeux
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};