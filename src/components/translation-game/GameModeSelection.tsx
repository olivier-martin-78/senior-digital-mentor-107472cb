
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
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Languages className="w-8 h-8" />
            Choisissez votre mode de jeu
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-2 font-medium">
              {gameWords.length} mots disponibles
            </p>
            <p className="text-sm text-blue-600 bg-blue-100 rounded-full px-4 py-2 inline-block">
              Vous allez jouer avec {totalQuestions} mots sélectionnés aléatoirement
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Button 
              onClick={() => onStartGame('fr-to-en')}
              className="h-20 text-lg bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold border-2 border-green-300"
              size="lg"
            >
              <Play className="w-6 h-6 mr-2" />
              Français → Anglais
            </Button>
            
            <Button 
              onClick={() => onStartGame('en-to-fr')}
              className="h-20 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold border-2 border-purple-300"
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
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Historique des parties
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {gameHistory.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                        {formatDate(session.date)}
                      </div>
                      <div className="text-sm font-medium bg-blue-100 text-blue-700 rounded-full px-3 py-1">
                        {getModeLabel(session.mode)}
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        {session.score}/{session.total}
                      </div>
                      <div className={`text-sm font-medium rounded-full px-3 py-1 ${
                        Math.round((session.score / session.total) * 100) >= 80 
                          ? 'bg-green-100 text-green-700' 
                          : Math.round((session.score / session.total) * 100) >= 60
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
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
                      className="ml-4 bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 hover:from-orange-200 hover:to-red-200 text-orange-700 font-medium"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Rejouer
                    </Button>
                  )}
                  
                  {/* Message si les mots ne sont pas disponibles (anciennes sessions) */}
                  {(!session.words || session.words.length === 0) && (
                    <div className="text-xs text-gray-400 ml-4 bg-gray-100 rounded-full px-3 py-1">
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
