import React from 'react';
import { Play, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChallengeFriend } from '@/hooks/useChallengeFriend';
import { ChallengeModal } from '@/components/games/ChallengeModal';
import { useAuth } from '@/contexts/AuthContext';
import { EmotionLeaderboard } from '@/types/emotionGame';

interface GameSetupProps {
  onStartGame: () => void;
  onInitializeGame: () => void;
  leaderboard: EmotionLeaderboard[];
  isLoading: boolean;
}

export const GameSetup: React.FC<GameSetupProps> = ({
  onStartGame,
  onInitializeGame,
  leaderboard,
  isLoading
}) => {
  const { user } = useAuth();
  const {
    isModalOpen,
    isLoading: isChallenging,
    openModal,
    closeModal,
    sendChallenge,
    getUserScore
  } = useChallengeFriend();

  const handleStartGame = async () => {
    await onInitializeGame();
    onStartGame();
  };

  const handleSendChallenge = async (friendEmail: string) => {
    if (!user) return;
    
    const currentScore = await getUserScore('audio', 'normal'); // Use 'audio' as fallback
    await sendChallenge(
      friendEmail,
      'audio' as 'audio' | 'visual', // Use 'audio' as fallback for emotion game
      'normal',
      currentScore
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Game Title */}
      <div className="text-center space-y-4">
        <div className="relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            La Palette des Émotions
          </h1>
          <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
            NOUVEAU
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Testez votre capacité à reconnaître les émotions et leur intensité à travers 24 images.
          Identifiez l'émotion (2 points) puis son intensité (1 point bonus) !
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Comment jouer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Observez l'image</p>
                  <p className="text-sm text-muted-foreground">
                    Une séquence de 24 images d'émotions vous sera présentée
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Identifiez l'émotion</p>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez la bonne émotion parmi 24 étiquettes (2 points)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Choisissez l'intensité</p>
                  <p className="text-sm text-muted-foreground">
                    Si c'est correct, déterminez l'intensité (1 point bonus)
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Score maximum :</strong> 72 points (24 × 3 points)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Classement du mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun score enregistré ce mois-ci</p>
                <p className="text-sm">Soyez le premier à jouer !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.rank_position === 1
                        ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700'
                        : entry.rank_position === 2
                        ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 border border-gray-200 dark:border-gray-600'
                        : entry.rank_position === 3
                        ? 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700'
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        entry.rank_position === 1
                          ? 'bg-yellow-500 text-white'
                          : entry.rank_position === 2
                          ? 'bg-gray-400 text-white'
                          : entry.rank_position === 3
                          ? 'bg-orange-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {entry.rank_position}
                      </div>
                      <div>
                        <p className="font-medium">{entry.user_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.games_played} partie{entry.games_played > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.best_total_points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          onClick={handleStartGame}
          disabled={isLoading}
          className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105"
        >
          <Play className="mr-2 h-5 w-5" />
          {isLoading ? 'Préparation...' : 'Commencer le jeu'}
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={openModal}
          className="px-8 py-3 rounded-xl font-semibold border-2 border-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300"
        >
          <Users className="mr-2 h-5 w-5" />
          Défier un ami
        </Button>
      </div>

      {/* Challenge Modal */}
      <ChallengeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSendChallenge={handleSendChallenge}
        challengerName={user?.user_metadata?.display_name || user?.email || 'Un joueur'}
        gameType="audio" // Using 'audio' as fallback for challenge system
        difficulty="Normal"
        challengerScore={leaderboard.find(entry => entry.user_id === user?.id)?.best_total_points}
        isLoading={isChallenging}
      />
    </div>
  );
};