
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GameMode } from '@/types/translationGame';

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
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="mb-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {gameMode === 'fr-to-en' ? '🇫🇷 ➡️ 🇬🇧' : '🇬🇧 ➡️ 🇫🇷'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <p className="text-lg text-gray-600 mb-2">
              {gameMode === 'fr-to-en' ? 'Traduisez en anglais :' : 'Traduisez en français :'}
            </p>
            <p className="text-4xl font-bold text-blue-600 mb-6">
              {currentWord}
            </p>
          </div>

          {!showResult ? (
            <div className="space-y-4">
              <Input
                type="text"
                value={userAnswer}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="Votre réponse..."
                className="text-lg text-center"
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
                className="w-full"
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
                  <span className="text-green-600">Correct ! 🎉</span>
                ) : (
                  <div>
                    <span className="text-red-600">Incorrect</span>
                    <p className="text-gray-600 mt-2">
                      La bonne réponse était : <strong>{correctAnswer}</strong>
                    </p>
                  </div>
                )}
              </div>
              <Button onClick={onNextQuestion} className="w-full">
                {currentQuestionIndex + 1 >= totalQuestions ? 'Voir les résultats' : 'Question suivante'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
