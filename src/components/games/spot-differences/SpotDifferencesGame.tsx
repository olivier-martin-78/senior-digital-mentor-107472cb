import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserActionsService } from '@/services/UserActionsService';

interface SpotDifferencesGameData {
  type: 'spot_differences';
  title: string;
  originalImageUrl: string;
  differencesImageUrl: string;
  differences: string[];
  thumbnailUrl?: string;
}

interface SpotDifferencesGameProps {
  gameData: SpotDifferencesGameData;
}

export const SpotDifferencesGame: React.FC<SpotDifferencesGameProps> = ({ gameData }) => {
  const [playerAnswers, setPlayerAnswers] = useState<string[]>(Array(7).fill(''));
  const [gameFinished, setGameFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [showCorrection, setShowCorrection] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const { toast } = useToast();

  // Track game start on first render
  useEffect(() => {
    if (!gameStarted) {
      UserActionsService.trackView('activity', 'spot-differences-started', gameData.title, {
        action: 'game_started'
      });
      setGameStarted(true);
    }
  }, [gameData.title, gameStarted]);

  const handleAnswerChange = (index: number, value: string) => {
    if (gameFinished) return;
    const newAnswers = [...playerAnswers];
    newAnswers[index] = value;
    setPlayerAnswers(newAnswers);
  };

  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  const calculateScore = (): { score: number; results: boolean[] } => {
    const usedCorrectAnswers = new Set<number>();
    
    const results = playerAnswers.map((answer) => {
      if (!answer.trim()) return false;
      
      const normalizedAnswer = normalizeText(answer);
      
      // Chercher la meilleure correspondance parmi toutes les réponses correctes non utilisées
      for (let i = 0; i < gameData.differences.length; i++) {
        if (usedCorrectAnswers.has(i)) continue;
        
        const normalizedCorrect = normalizeText(gameData.differences[i]);
        
        // Vérification exacte
        if (normalizedAnswer === normalizedCorrect) {
          usedCorrectAnswers.add(i);
          return true;
        }
        
        // Vérification si la réponse contient la bonne réponse
        if (normalizedAnswer.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedAnswer)) {
          if (normalizedAnswer.length > 2) { // Éviter les correspondances trop courtes
            usedCorrectAnswers.add(i);
            return true;
          }
        }
      }
      
      return false;
    });

    const score = results.filter(Boolean).length;
    return { score, results };
  };

  const handleSubmit = () => {
    // Vérifier que toutes les réponses sont remplies
    const filledAnswers = playerAnswers.filter(answer => answer.trim() !== '');
    if (filledAnswers.length !== 7) {
      toast({
        title: "Attention",
        description: "Veuillez répondre aux 7 différences avant de valider.",
        variant: "destructive",
      });
      return;
    }

    const { score: finalScore, results: gameResults } = calculateScore();
    setScore(finalScore);
    setResults(gameResults);
    setGameFinished(true);

    // Track game submission
    UserActionsService.trackView('activity', 'spot-differences-submitted', gameData.title, {
      action: 'game_submitted',
      score: finalScore,
      totalDifferences: 7
    });

    toast({
      title: "Jeu terminé !",
      description: `Vous avez trouvé ${finalScore} différence${finalScore > 1 ? 's' : ''} sur 7.`,
    });
  };

  const handleReset = () => {
    setPlayerAnswers(Array(7).fill(''));
    setGameFinished(false);
    setScore(0);
    setResults([]);
    setShowCorrection(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">{gameData.title}</CardTitle>
          {gameFinished && (
            <div className="text-center">
              <Badge variant={score >= 5 ? "default" : score >= 3 ? "secondary" : "destructive"} className="text-lg px-4 py-2">
                Score: {score}/7
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Images */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-center">Image originale</h3>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={gameData.originalImageUrl}
                  alt="Image originale"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-center">Image avec 7 différences</h3>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={gameData.differencesImageUrl}
                  alt="Image avec différences"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Zone de réponses */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">
              Trouvez les 7 différences et décrivez-les ci-dessous
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playerAnswers.map((answer, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`answer-${index + 1}`} className="flex items-center gap-2">
                    Différence #{index + 1}
                    {gameFinished && (
                      results[index] ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )
                    )}
                  </Label>
                  <Textarea
                    id={`answer-${index + 1}`}
                    value={answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder={`Décrivez la différence #${index + 1}`}
                    className="resize-none"
                    rows={2}
                    disabled={gameFinished}
                  />
                  {gameFinished && !results[index] && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Bonne réponse:</strong> {gameData.differences[index]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-center space-x-4">
            {!gameFinished ? (
              <Button onClick={handleSubmit} size="lg">
                Valider mes réponses
              </Button>
            ) : (
              <>
                <Button onClick={() => setShowCorrection(!showCorrection)} size="lg" variant="secondary">
                  {showCorrection ? 'Masquer la correction' : 'Voir la correction'}
                </Button>
                <Button onClick={handleReset} size="lg" variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Rejouer
                </Button>
              </>
            )}
          </div>

          {/* Correction complète */}
          {gameFinished && showCorrection && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-4 text-blue-900 dark:text-blue-100">Correction - Toutes les bonnes réponses :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameData.differences.map((difference, index) => (
                  <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Différence #{index + 1}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {difference}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Résultats détaillés */}
          {gameFinished && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Résultats détaillés:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {results.map((isCorrect, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Différence #{index + 1}: {isCorrect ? 'Correct' : 'Incorrect'}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                {score === 7 && (
                  <p className="text-green-600 font-semibold">🎉 Parfait ! Toutes les différences trouvées !</p>
                )}
                {score >= 5 && score < 7 && (
                  <p className="text-blue-600 font-semibold">👍 Très bien ! Presque toutes les différences trouvées !</p>
                )}
                {score >= 3 && score < 5 && (
                  <p className="text-orange-600 font-semibold">👌 Pas mal ! Plus de la moitié des différences trouvées !</p>
                )}
                {score < 3 && (
                  <p className="text-red-600 font-semibold">💪 Continuez à vous entraîner !</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};