
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GameResultsProps {
  score: number;
  totalQuestions: number;
  onResetGame: () => void;
}

export const GameResults = ({ score, totalQuestions, onResetGame }: GameResultsProps) => {
  const getResultMessage = () => {
    if (score >= 16) return 'Excellent ! Vous maîtrisez parfaitement !';
    if (score >= 12) return 'Très bien ! Continuez comme ça !';
    if (score >= 8) return 'Pas mal ! Encore quelques efforts !';
    return 'Continuez à vous entraîner !';
  };

  const getResultEmoji = () => {
    if (score >= 16) return '🎉';
    if (score >= 12) return '😊';
    if (score >= 8) return '🙂';
    return '😐';
  };

  const getResultIcon = () => {
    if (score >= 16) return '🏆';
    if (score >= 12) return '🥈';
    if (score >= 8) return '🥉';
    return '💪';
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">
            {getResultIcon()} Jeu terminé !
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-6xl mb-4">
            {getResultEmoji()}
          </div>
          <p className="text-2xl font-bold mb-4">
            Score final : {score} / {totalQuestions}
          </p>
          <p className="text-lg text-gray-600 mb-6">
            {getResultMessage()}
          </p>
          <div className="space-y-3">
            <Button onClick={onResetGame} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Rejouer
            </Button>
            <Link to="/activities/activities">
              <Button variant="outline" className="w-full">
                Retour aux activités
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
