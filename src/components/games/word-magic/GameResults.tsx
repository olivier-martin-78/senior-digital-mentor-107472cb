import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useChallengeFriend } from '@/hooks/useChallengeFriend';
import { ChallengeModal } from '@/components/games/ChallengeModal';
import { 
  Trophy, 
  Star, 
  Clock, 
  Target,
  CheckCircle,
  RotateCcw,
  Home,
  Share,
  ChevronRight,
  Award
} from 'lucide-react';
import { WordMagicLevel, GameStats, WordMagicLeaderboard } from '@/types/wordMagicGame';

interface GameResultsProps {
  gameStats: GameStats;
  foundWords: string[];
  level: WordMagicLevel | null;
  leaderboard: WordMagicLeaderboard[];
  onResetGame: () => void;
  onNextLevel?: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({
  gameStats,
  foundWords,
  level,
  leaderboard,
  onResetGame,
  onNextLevel
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendChallenge, isLoading: isSendingChallenge } = useChallengeFriend();
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  // Calculate performance metrics
  const completionPercentage = level && level.solutions.length > 0 
    ? Math.round((foundWords.filter(word => level.solutions.includes(word)).length / level.solutions.length) * 100)
    : 0;
    
  const bonusPercentage = level && level.bonus_words.length > 0
    ? Math.round((gameStats.bonus_words_found / level.bonus_words.length) * 100)
    : 0;

  // Find user rank
  const userRank = leaderboard.findIndex(entry => entry.user_id === user?.id) + 1;

  // Get encouraging message based on performance
  const getEncouragingMessage = (): string => {
    if (completionPercentage === 100) {
      return "Parfait ! Vous avez trouvé tous les mots ! 🎉";
    } else if (completionPercentage >= 80) {
      return "Excellent travail ! Presque tous les mots trouvés ! 👏";
    } else if (completionPercentage >= 60) {
      return "Bonne performance ! Continuez comme ça ! 👍";
    } else if (completionPercentage >= 40) {
      return "Pas mal ! Il y a encore quelques mots à découvrir ! 💪";
    } else {
      return "C'est un bon début ! Essayez encore pour améliorer votre score ! 🌟";
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSendChallenge = async (email: string) => {
    if (!user || !level) return;

    try {
      // For word magic, we'll use 'audio' as a temporary gameType since the current system only supports audio/visual
      await sendChallenge(
        email,
        'audio', // temporary until we extend the challenge system
        level.difficulty,
        gameStats.score
      );
      setShowChallengeModal(false);
    } catch (error) {
      console.error('❌ Error sending challenge:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white mb-4">
          <Award className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Niveau terminé !
        </h1>
        <p className="text-lg text-muted-foreground">
          {getEncouragingMessage()}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Votre performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold text-primary">{gameStats.score}</p>
                  <p className="text-sm text-muted-foreground">Score total</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{gameStats.words_found}</p>
                  <p className="text-sm text-muted-foreground">Mots trouvés</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg">
                  <Star className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{gameStats.bonus_words_found}</p>
                  <p className="text-sm text-muted-foreground">Mots bonus</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">
                    {gameStats.completion_time ? formatTime(gameStats.completion_time) : '--'}
                  </p>
                  <p className="text-sm text-muted-foreground">Temps</p>
                </div>
              </div>

              {/* Performance Details */}
              {level && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Mots principaux</span>
                      <span className="text-sm text-muted-foreground">
                        {foundWords.filter(word => level.solutions.includes(word)).length} / {level.solutions.length}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                  
                  {level.bonus_words.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Mots bonus</span>
                        <span className="text-sm text-muted-foreground">
                          {gameStats.bonus_words_found} / {level.bonus_words.length}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${bonusPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Rank */}
              {userRank > 0 && (
                <div className="flex items-center justify-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="font-medium">
                    Votre rang ce mois-ci : #{userRank}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Classement du mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div 
                    key={entry.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.user_id === user?.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${
                          entry.user_id === user?.id ? 'text-primary' : ''
                        }`}>
                          {entry.user_name}
                          {entry.user_id === user?.id && ' (Vous)'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.total_levels_completed} niveaux
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{entry.best_score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button
          onClick={onResetGame}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Rejouer
        </Button>

        {onNextLevel && (
          <Button
            onClick={onNextLevel}
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Niveau suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        <Button
          onClick={() => setShowChallengeModal(true)}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Share className="h-4 w-4" />
          Défier un ami
        </Button>

        <Button
          onClick={() => navigate('/activities/games')}
          variant="ghost"
          size="lg"
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Retour aux jeux
        </Button>
      </div>

      {/* Challenge Modal */}
      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        onSendChallenge={handleSendChallenge}
        challengerName={user?.email || 'Un joueur'}
        gameType="audio"
        difficulty={level?.difficulty || 'moyen'}
        challengerScore={gameStats.score}
        isLoading={isSendingChallenge}
      />
    </div>
  );
};

export default GameResults;