
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Languages, Clock } from 'lucide-react';
import { GameWord, GameSession } from '@/types/translationGame';

interface GameModeSelectionProps {
  gameWords: GameWord[];
  gameHistory: GameSession[];
  onStartGame: (mode: 'fr-to-en' | 'en-to-fr') => void;
  onReplayGame?: (mode: 'fr-to-en' | 'en-to-fr', words: GameWord[]) => void;
  totalQuestions: number;
}

export const GameModeSelection = ({ 
  gameWords, 
  gameHistory, 
  onStartGame, 
  onReplayGame,
  totalQuestions 
}: GameModeSelectionProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModeLabel = (mode: 'fr-to-en' | 'en-to-fr') => {
    return mode === 'fr-to-en' ? 'Français → Anglais' : 'Anglais → Français';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Mode de jeu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            <Languages className="w-8 h-8 mx-auto mb-2" />
            Choisissez votre mode de jeu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">
              {gameWords.length} mots disponibles
            </p>
            <p className="text-sm text-gray-500">
              Vous allez jouer avec {totalQuestions} mots sélectionnés aléatoirement
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Button 
              onClick={() => onStartGame('fr-to-en')}
              className="h-20 text-lg"
              size="lg"
            >
              <Play className="w-6 h-6 mr-2" />
              Français → Anglais
            </Button>
            
            <Button 
              onClick={() => onStartGame('en-to-fr')}
              className="h-20 text-lg"
              variant="outline"
              size="lg"
            >
              <Play className="w-6 h-6 mr-2" />
              Anglais → Français
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique des parties */}
      {gameHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              <Clock className="w-6 h-6 inline mr-2" />
              Historique des parties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gameHistory.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500">
                        {formatDate(session.date)}
                      </div>
                      <div className="text-sm font-medium">
                        {getModeLabel(session.mode)}
                      </div>
                      <div className="text-lg font-bold">
                        {session.score}/{session.total}
                      </div>
                      <div className="text-sm text-gray-600">
                        ({Math.round((session.score / session.total) * 100)}%)
                      </div>
                    </div>
                  </div>
                  
                  {/* Bouton rejouer - affiché seulement si les mots sont disponibles */}
                  {session.words && session.words.length > 0 && onReplayGame && (
                    <Button
                      onClick={() => onReplayGame(session.mode, session.words!)}
                      variant="outline"
                      size="sm"
                      className="ml-4"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Rejouer
                    </Button>
                  )}
                  
                  {/* Message si les mots ne sont pas disponibles (anciennes sessions) */}
                  {(!session.words || session.words.length === 0) && (
                    <div className="text-xs text-gray-400 ml-4">
                      Ancienne partie
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
