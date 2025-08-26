import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trophy, Play, Users, Medal, Award, Database, AlertCircle, Swords } from 'lucide-react';
import { DifficultyLevel, LeaderboardEntry } from '@/types/audioMemoryGame';
import { supabase } from '@/integrations/supabase/client';
import { useAudioMemoryDB } from '@/hooks/useAudioMemoryDB';
import { useChallengeFriend } from '@/hooks/useChallengeFriend';
import { ChallengeModal } from '@/components/games/ChallengeModal';
import { useAuth } from '@/contexts/AuthContext';

interface GameSetupProps {
  difficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onStartGame: () => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({
  difficulty,
  onDifficultyChange,
  onStartGame
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { hasSounds, isLoading: soundsLoading, soundsCount } = useAudioMemoryDB();
  const { user, profile } = useAuth();
  const {
    isModalOpen,
    isLoading: challengeLoading,
    openModal,
    closeModal,
    sendChallenge,
    getUserScore
  } = useChallengeFriend();

  useEffect(() => {
    loadLeaderboard();
  }, [difficulty]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_audio_memory_leaderboard', { p_difficulty_level: difficulty });

      if (error) throw error;
      
      const mappedData: LeaderboardEntry[] = (data || []).map(entry => ({
        userId: entry.user_id,
        userName: entry.user_name,
        bestScore: entry.best_score,
        bestTotalPoints: entry.best_total_points,
        gamesPlayed: entry.games_played,
        rankPosition: entry.rank_position
      }));
      setLeaderboard(mappedData);
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyInfo = (level: DifficultyLevel) => {
    switch (level) {
      case 'beginner':
        return { name: 'Débutant', sounds: 4, color: 'bg-green-500' };
      case 'intermediate':
        return { name: 'Intermédiaire', sounds: 6, color: 'bg-yellow-500' };
      case 'advanced':
        return { name: 'Avancé', sounds: 8, color: 'bg-red-500' };
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const handleSendChallenge = async (friendEmail: string) => {
    const challengerScore = await getUserScore('audio', difficulty);
    await sendChallenge(friendEmail, 'audio', difficulty, challengerScore);
  };

  return (
    <div className="space-y-6">
      {/* Configuration du jeu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-6 h-6" />
            Mémoire Auditive Inversée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Niveau de difficulté
              </label>
              <Select value={difficulty} onValueChange={onDifficultyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Débutant (4 sons)
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      Intermédiaire (6 sons)
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      Avancé (8 sons)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Comment jouer ?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Une séquence de {getDifficultyInfo(difficulty).sounds} sons sera jouée 4 fois</li>
                <li>• Chaque son dure 2 secondes</li>
                <li>• Répondez aux questions de difficulté croissante</li>
                <li>• Phase finale : reconstituer la séquence inversée en 60 secondes</li>
                <li>• Bonus de 15 points + bonus temporel si parfait !</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={onStartGame} 
            size="lg" 
            className="w-full"
            disabled={!hasSounds}
          >
            <Play className="w-5 h-5 mr-2" />
            Commencer le jeu
          </Button>

          {/* Status des sons */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
            <Database className="w-4 h-4" />
            <div className="flex-1">
              {soundsLoading ? (
                <span className="text-sm text-muted-foreground">Chargement des sons...</span>
              ) : hasSounds ? (
                <span className="text-sm text-green-600">{soundsCount} sons disponibles</span>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-600">Aucun son disponible - Contactez l'administrateur</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            Classement {getDifficultyInfo(difficulty).name}
            <Badge variant="outline">Ce mois</Badge>
          </CardTitle>
          {user && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openModal}
              className="flex items-center gap-2"
            >
              <Swords className="h-4 w-4" />
              Défier un ami
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement du classement...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun score enregistré ce mois-ci.
              <br />
              Soyez le premier !
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(entry.rankPosition)}
                    <div className="flex-1">
                      <div className="font-medium">{entry.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.gamesPlayed} partie{entry.gamesPlayed > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{entry.bestTotalPoints}</div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de défi */}
      <ChallengeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSendChallenge={handleSendChallenge}
        challengerName={profile?.display_name || user?.email || 'Un ami'}
        gameType="audio"
        difficulty={difficulty}
        isLoading={challengeLoading}
      />
    </div>
  );
};