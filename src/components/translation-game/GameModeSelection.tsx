
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameWord, GameSession } from '@/types/translationGame';
import { Languages, RotateCcw, Trophy, Calendar } from 'lucide-react';

interface GameModeSelectionProps {
  gameWords: GameWord[];
  gameHistory: GameSession[];
  onStartGame: (mode: 'fr-to-en' | 'en-to-fr') => void;
  onReplayGame: (mode: 'fr-to-en' | 'en-to-fr', words: GameWord[]) => void;
  totalQuestions: number;
}

export const GameModeSelection: React.FC<GameModeSelectionProps> = ({
  gameWords,
  gameHistory,
  onStartGame,
  onReplayGame,
  totalQuestions
}) => {
  const formatScore = (session: GameSession) => {
    const percentage = Math.round((session.score / session.total) * 100);
    return `${session.score}/${session.total} (${percentage}%)`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModeLabel = (mode: string) => {
    return mode === 'fr-to-en' ? 'Français → Anglais' : 'Anglais → Français';
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Jeu de Traduction
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Testez vos connaissances en français et anglais
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Languages className="w-4 h-4" />
          <span>{gameWords.length} mots disponibles</span>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200 hover:border-blue-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                🇫🇷
              </div>
              Français → Anglais
            </CardTitle>
            <CardDescription>
              Traduisez des mots français vers l'anglais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => onStartGame('fr-to-en')}
              className="w-full"
              size="lg"
            >
              Commencer
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 hover:border-green-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                🇬🇧
              </div>
              Anglais → Français
            </CardTitle>
            <CardDescription>
              Traduisez des mots anglais vers le français
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => onStartGame('en-to-fr')}
              className="w-full"
              size="lg"
            >
              Commencer
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Game History */}
      {gameHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Historique des parties
            </CardTitle>
            <CardDescription>
              Vos dernières parties et résultats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gameHistory.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getScoreColor(session.score, session.total)}>
                      {formatScore(session)}
                    </Badge>
                    <span className="text-sm font-medium">
                      {getModeLabel(session.mode)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(session.date)}
                    </div>
                  </div>
                  
                  {session.words && session.words.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onReplayGame(session.mode, session.words)}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Rejouer
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Comment jouer ?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">1.</span>
              Choisissez votre mode de jeu (français vers anglais ou l'inverse)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">2.</span>
              Vous devez traduire {totalQuestions} mots au total
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">3.</span>
              Tapez votre traduction et validez avec Entrée ou le bouton
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">4.</span>
              Votre score final sera sauvegardé dans votre historique
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
