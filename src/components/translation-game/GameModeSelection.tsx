
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import { GameSession } from '@/types/translationGame';

interface GameModeSelectionProps {
  gameWords: any[];
  gameHistory: GameSession[];
  onStartGame: (mode: 'fr-to-en' | 'en-to-fr') => void;
  totalQuestions: number;
}

export const GameModeSelection = ({ 
  gameWords, 
  gameHistory, 
  onStartGame, 
  totalQuestions 
}: GameModeSelectionProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          🇫🇷 ↔️ 🇬🇧 Jeu de Traduction
        </h1>
        <p className="text-lg text-gray-600">
          Traduisez {totalQuestions} mots et testez vos connaissances !
        </p>
      </div>

      {/* Debug info - temporary */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          🔧 Debug: {gameWords.length} mots chargés depuis la base de données
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onStartGame('fr-to-en')}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🇫🇷 ➡️ 🇬🇧</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg font-semibold mb-2">Français vers Anglais</p>
            <p className="text-gray-600">Traduisez les mots français en anglais</p>
            <Button className="mt-4 w-full bg-blue-500 hover:bg-blue-600">
              Commencer
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onStartGame('en-to-fr')}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🇬🇧 ➡️ 🇫🇷</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg font-semibold mb-2">Anglais vers Français</p>
            <p className="text-gray-600">Traduisez les mots anglais en français</p>
            <Button className="mt-4 w-full bg-purple-500 hover:bg-purple-600">
              Commencer
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Historique des parties */}
      {gameHistory.length > 0 && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Historique des parties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gameHistory.map((session, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {session.mode === 'fr-to-en' ? '🇫🇷➡️🇬🇧' : '🇬🇧➡️🇫🇷'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDate(session.date)}
                    </span>
                  </div>
                  <div className="font-semibold">
                    {session.score}/{session.total}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
