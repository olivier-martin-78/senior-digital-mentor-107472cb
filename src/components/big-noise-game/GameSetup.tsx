import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Play, Users, Volume2, Timer, Target } from 'lucide-react';
import { LeaderboardEntry } from '@/types/bigNoiseGame';
import { ChallengeModal } from '../games/ChallengeModal';
import { useChallengeFriend } from '@/hooks/useChallengeFriend';

interface GameSetupProps {
  leaderboard: LeaderboardEntry[];
  onStartGame: () => void;
  hasSounds: boolean;
  soundsCount: number;
  isLoading: boolean;
}

export const GameSetup: React.FC<GameSetupProps> = ({
  leaderboard,
  onStartGame,
  hasSounds,
  soundsCount,
  isLoading
}) => {
  const {
    isModalOpen,
    isLoading: challengeLoading,
    openModal,
    closeModal,
    sendChallenge,
    getUserScore
  } = useChallengeFriend();

  const [challengerScore, setChallengerScore] = useState<number | undefined>(undefined);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const handleChallengeFriend = async () => {
    try {
      const score = await getUserScore('audio', 'big-noise');
      setChallengerScore(score);
      openModal();
    } catch (error) {
      console.error('Erreur lors de la récupération du score:', error);
      openModal();
    }
  };

  const handleSendChallenge = async (friendEmail: string) => {
    await sendChallenge(friendEmail, 'audio', 'big-noise', challengerScore);
    closeModal();
  };

  return (
    <div className="space-y-6">
      {/* Game Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-6 h-6" />
            Le jeu qui fait grand bruit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              <span className="text-sm">20 sons à identifier</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm">3 secondes par son</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-sm">Classement mensuel</span>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Règles du jeu :</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Chaque son est joué pendant 3 secondes</li>
              <li>• Saisissez un mot-clé correspondant au son (2 points si correct)</li>
              <li>• Si incorrect, choisissez parmi les étiquettes (0,5 point si correct)</li>
              <li>• Bonus : nombre de bonnes réponses consécutives × 5 points</li>
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={hasSounds ? "default" : "destructive"}>
                {soundsCount} sons disponibles
              </Badge>
              {!hasSounds && (
                <span className="text-sm text-muted-foreground">
                  (20 sons minimum requis)
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleChallengeFriend}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Users className="w-4 h-4" />
                Défier un ami
              </Button>
              
              <Button
                onClick={onStartGame}
                disabled={!hasSounds || isLoading}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Commencer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Classement du mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune partie jouée ce mois-ci. Soyez le premier !
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((entry) => (
                <div
                  key={entry.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(entry.rank_position)}
                    <div>
                      <p className="font-medium">{entry.user_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.games_played} partie{entry.games_played > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{entry.best_score} points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ChallengeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSendChallenge={handleSendChallenge}
        challengerName="Vous"
        gameType="audio"
        difficulty="big-noise"
        challengerScore={challengerScore}
        isLoading={challengeLoading}
      />
    </div>
  );
};