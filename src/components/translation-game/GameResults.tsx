
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

  const getResultColors = () => {
    if (score >= 16) return 'from-yellow-200 to-orange-200 border-yellow-400';
    if (score >= 12) return 'from-green-200 to-blue-200 border-green-400';
    if (score >= 8) return 'from-blue-200 to-purple-200 border-blue-400';
    return 'from-gray-200 to-gray-300 border-gray-400';
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <Card className={`bg-gradient-to-br ${getResultColors()} border-2`}>
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="text-3xl">
            {getResultIcon()} Jeu terminé !
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-6xl mb-4">
            {getResultEmoji()}
          </div>
          <div className="bg-white rounded-lg p-4 border-2 border-purple-300 mb-4">
            <p className="text-2xl font-bold text-purple-600 mb-2">
              Score final : {score} / {totalQuestions}
            </p>
            <div className={`text-lg font-medium rounded-full px-4 py-2 inline-block ${
              score >= 16 ? 'bg-yellow-100 text-yellow-700' :
              score >= 12 ? 'bg-green-100 text-green-700' :
              score >= 8 ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {Math.round((score / totalQuestions) * 100)}%
            </div>
          </div>
          <p className="text-lg text-gray-700 mb-6 font-medium">
            {getResultMessage()}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={onResetGame} 
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 text-lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Rejouer
            </Button>
            <Link to="/activities">
              <Button 
                variant="outline" 
                className="w-full border-2 border-purple-300 hover:bg-purple-50 text-purple-700 font-medium py-3 text-lg"
              >
                Retour aux activités
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
