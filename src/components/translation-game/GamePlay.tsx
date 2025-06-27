
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GameMode } from '@/types/translationGame';
import { useEffect } from 'react';

interface GamePlayProps {
  gameMode: GameMode;
  currentWord: string;
  correctAnswer: string;
  userAnswer: string;
  showResult: boolean;
  isCorrect: boolean | null;
  totalQuestions: number;
  currentQuestionIndex: number;
  onAnswerChange: (answer: string) => void;
  onCheckAnswer: () => void;
  onNextQuestion: () => void;
}

export const GamePlay = ({
  gameMode,
  currentWord,
  correctAnswer,
  userAnswer,
  showResult,
  isCorrect,
  totalQuestions,
  currentQuestionIndex,
  onAnswerChange,
  onCheckAnswer,
  onNextQuestion,
}: GamePlayProps) => {
  // Raccourci clavier pour la barre d'espace
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && showResult) {
        event.preventDefault();
        onNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showResult, onNextQuestion]);

  const remainingQuestions = totalQuestions - currentQuestionIndex - 1;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            {gameMode === 'fr-to-en' ? '🇫🇷 ➡️ 🇬🇧' : '🇬🇧 ➡️ 🇫🇷'}
            <span className="text-sm font-normal ml-4">
              {remainingQuestions > 0 ? `${remainingQuestions} questions restantes` : 'Dernière question !'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center pt-6">
          <div className="mb-6">
            <p className="text-lg text-gray-700 mb-2 font-medium">
              {gameMode === 'fr-to-en' ? 'Traduisez en anglais :' : 'Traduisez en français :'}
            </p>
            <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
              <p className="text-4xl font-bold text-blue-600 mb-2">
                {currentWord}
              </p>
            </div>
          </div>

          {!showResult ? (
            <div className="space-y-4">
              <Input
                type="text"
                value={userAnswer}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="Votre réponse..."
                className="text-lg text-center border-2 border-purple-300 focus:border-purple-500 bg-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && userAnswer.trim()) {
                    onCheckAnswer();
                  }
                }}
                autoFocus
              />
              <Button 
                onClick={onCheckAnswer}
                disabled={!userAnswer.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 text-lg"
              >
                Valider
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`text-6xl ${isCorrect ? 'animate-bounce' : ''}`}>
                {isCorrect ? '😊' : '😞'}
              </div>
              <div className="text-xl font-semibold">
                {isCorrect ? (
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
                    <span className="text-green-700 text-xl font-bold">Correct ! 🎉</span>
                  </div>
                ) : (
                  <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
                    <span className="text-red-700 text-xl font-bold">Incorrect</span>
                    <p className="text-gray-700 mt-2">
                      La bonne réponse était : <strong className="text-red-600">{correctAnswer}</strong>
                    </p>
                  </div>
                )}
              </div>
              <Button 
                onClick={onNextQuestion} 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 text-lg"
              >
                {currentQuestionIndex + 1 >= totalQuestions ? 'Voir les résultats' : 'Question suivante'}
                <span className="ml-2 text-sm opacity-75">(ou appuyez sur Espace)</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
