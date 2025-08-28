import React from 'react';
import { Trophy, Heart, Zap, Clock, RotateCcw, Home, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useChallengeFriend } from '@/hooks/useChallengeFriend';
import { ChallengeModal } from '@/components/games/ChallengeModal';
import { useAuth } from '@/contexts/AuthContext';
import { GameStats, EmotionLeaderboard } from '@/types/emotionGame';

interface GameResultsProps {
  gameStats: GameStats;
  leaderboard: EmotionLeaderboard[];
  onResetGame: () => void;
  onFetchLeaderboard: () => void;
}

export const GameResults: React.FC<GameResultsProps> = ({
  gameStats,
  leaderboard,
  onResetGame,
  onFetchLeaderboard
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isModalOpen,
    isLoading: isChallenging,
    openModal,
    closeModal,
    sendChallenge
  } = useChallengeFriend();

  // Calculate percentages
  const emotionPercentage = (gameStats.emotionCorrect / 24) * 100;
  const intensityPercentage = gameStats.intensityCorrect > 0 ? (gameStats.intensityCorrect / gameStats.emotionCorrect) * 100 : 0;
  const totalPercentage = (gameStats.totalScore / 72) * 100;

  // Get user rank
  const userRank = leaderboard.find(entry => entry.user_id === user?.id)?.rank_position || null;

  // Generate encouraging message
  const getEncouragingMessage = () => {
    if (totalPercentage >= 90) {
      return "🌟 Extraordinaire ! Vous êtes un véritable expert des émotions !";
    } else if (totalPercentage >= 80) {
      return "🎉 Excellent travail ! Votre empathie est remarquable !";
    } else if (totalPercentage >= 70) {
      return "👏 Très bon score ! Vous comprenez bien les émotions !";
    } else if (totalPercentage >= 60) {
      return "😊 Belle performance ! Continuez à développer votre intelligence émotionnelle !";
    } else if (totalPercentage >= 50) {
      return "🎯 Bon début ! Avec de la pratique, vous allez progresser !";
    } else {
      return "💪 Ne vous découragez pas ! Chaque tentative vous rend meilleur !";
    }
  };

  const handleSendChallenge = async (friendEmail: string) => {
    await sendChallenge(
      friendEmail,
      'audio' as 'audio' | 'visual', // Use 'audio' as fallback for emotion game
      'normal',
      gameStats.totalScore
    );
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  React.useEffect(() => {
    onFetchLeaderboard();
  }, [onFetchLeaderboard]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Results Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Trophy className="h-10 w-10 text-yellow-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Résultats
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {getEncouragingMessage()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Votre performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Score */}
            <div className="text-center space-y-2">
              <div className="text-5xl font-bold text-primary">
                {gameStats.totalScore}
              </div>
              <div className="text-muted-foreground">points sur 72</div>
              <Progress value={totalPercentage} className="w-full" />
              <div className="text-sm text-muted-foreground">
                {totalPercentage.toFixed(1)}% de réussite
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Émotions correctes</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{gameStats.emotionCorrect}/24</div>
                  <div className="text-sm text-muted-foreground">
                    {emotionPercentage.toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span>Intensités correctes</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{gameStats.intensityCorrect}/{gameStats.emotionCorrect}</div>
                  <div className="text-sm text-muted-foreground">
                    {gameStats.emotionCorrect > 0 ? intensityPercentage.toFixed(0) : 0}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span>Temps total</span>
                </div>
                <div className="font-bold">
                  {formatTime(gameStats.completionTime)}
                </div>
              </div>
            </div>

            {/* Rank */}
            {userRank && (
              <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">#{userRank}</div>
                <div className="text-sm text-muted-foreground">
                  Votre classement ce mois-ci
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Updated Leaderboard */}
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
                <p>Chargement du classement...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                      entry.user_id === user?.id
                        ? 'bg-primary/10 border-2 border-primary/30 scale-105'
                        : entry.rank_position === 1
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
                        <p className={`font-medium ${entry.user_id === user?.id ? 'text-primary' : ''}`}>
                          {entry.user_name}
                          {entry.user_id === user?.id && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Vous
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.games_played} partie{entry.games_played > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${entry.user_id === user?.id ? 'text-primary' : ''}`}>
                        {entry.best_total_points}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
                
                {leaderboard.length > 5 && userRank && userRank > 5 && (
                  <div className="text-center text-muted-foreground text-sm py-2">
                    ...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          onClick={onResetGame}
          className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Rejouer
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

        <Button
          size="lg"
          variant="outline"
          onClick={() => navigate('/activities/games')}
          className="px-8 py-3 rounded-xl font-semibold transition-all duration-300"
        >
          <Home className="mr-2 h-5 w-5" />
          Retour aux jeux
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
        challengerScore={gameStats.totalScore}
        isLoading={isChallenging}
      />
    </div>
  );
};