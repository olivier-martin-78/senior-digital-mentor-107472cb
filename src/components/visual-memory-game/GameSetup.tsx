import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Users, Star, Swords } from 'lucide-react';
import { DifficultyLevel, GameSettings, LeaderboardEntry } from '@/types/visualMemoryGame';
import { supabase } from '@/integrations/supabase/client';
import { useChallengeFriend } from '@/hooks/useChallengeFriend';
import { ChallengeModal } from '@/components/games/ChallengeModal';
import { useAuth } from '@/contexts/AuthContext';

interface GameSetupProps {
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onStartGame: () => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({
  settings,
  onUpdateSettings,
  onStartGame
}) => {
  const [leaderboards, setLeaderboards] = useState<Record<DifficultyLevel, LeaderboardEntry[]>>({
    beginner: [],
    intermediate: [],
    advanced: []
  });
  const [loading, setLoading] = useState(true);
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
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      const difficulties: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
      const leaderboardData: Record<DifficultyLevel, LeaderboardEntry[]> = {
        beginner: [],
        intermediate: [],
        advanced: []
      };

      for (const difficulty of difficulties) {
        const { data } = await supabase.rpc('get_visual_memory_leaderboard', {
          p_difficulty_level: difficulty
        });
        
        if (data) {
          leaderboardData[difficulty] = data.slice(0, 5).map(entry => ({
            userId: entry.user_id,
            userName: entry.user_name,
            bestScore: entry.best_score,
            bestTotalPoints: entry.best_total_points,
            gamesPlayed: entry.games_played,
            rankPosition: entry.rank_position
          })); // Top 5
        }
      }

      setLeaderboards(leaderboardData);
    } catch (error) {
      console.error('Erreur lors du chargement des classements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyInfo = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'beginner':
        return {
          label: 'Débutant',
          description: '4 images à mémoriser',
          color: 'bg-green-500',
          icon: '🟢'
        };
      case 'intermediate':
        return {
          label: 'Intermédiaire',
          description: '7 images à mémoriser',
          color: 'bg-yellow-500',
          icon: '🟡'
        };
      case 'advanced':
        return {
          label: 'Avancé',
          description: '10 images à mémoriser',
          color: 'bg-red-500',
          icon: '🔴'
        };
    }
  };

  const currentDifficultyInfo = getDifficultyInfo(settings.difficulty);

  const handleSendChallenge = async (friendEmail: string) => {
    const challengerScore = await getUserScore('visual', settings.difficulty);
    await sendChallenge(friendEmail, 'visual', settings.difficulty, challengerScore);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* En-tête du jeu */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
              🧠 Mémoire Visuelle Inversée
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              Mémorisez la séquence d'images et relevez les défis progressifs !
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Paramètres du jeu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Configuration du jeu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-3">
                <label className="text-sm font-medium">Niveau de difficulté</label>
                <Select 
                  value={settings.difficulty}
                  onValueChange={(value: DifficultyLevel) => onUpdateSettings({ difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">
                      <div className="flex items-center gap-2">
                        🟢 Débutant (4 images)
                      </div>
                    </SelectItem>
                    <SelectItem value="intermediate">
                      <div className="flex items-center gap-2">
                        🟡 Intermédiaire (7 images)
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <div className="flex items-center gap-2">
                        🔴 Avancé (10 images)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className={currentDifficultyInfo.color + ' text-white'}>
                    {currentDifficultyInfo.icon} {currentDifficultyInfo.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {currentDifficultyInfo.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Durée d'affichage: {settings.displayDuration} secondes
                  </div>
                  <div>• Phase 1: Questions Oui/Non (1 point)</div>
                  <div>• Phase 2: Questions couleur (2 points)</div>
                  <div>• Phase 3: Questions position (3 points)</div>
                  <div>• Phase 4: Séquence inversée + bonus temporel</div>
                </div>
              </div>

              <Button 
                onClick={onStartGame} 
                size="lg" 
                className="w-full"
              >
                🚀 Commencer le jeu
              </Button>
            </CardContent>
          </Card>

          {/* Classements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Classements du mois
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
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Chargement des classements...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map((difficulty) => {
                    const difficultyInfo = getDifficultyInfo(difficulty);
                    const leaderboard = leaderboards[difficulty];
                    
                    return (
                      <div key={difficulty} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {difficultyInfo.icon} {difficultyInfo.label}
                          </Badge>
                        </div>
                        
                        {leaderboard.length > 0 ? (
                          <div className="space-y-1">
                            {leaderboard.slice(0, 3).map((entry, index) => (
                              <div key={entry.userId} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                  </span>
                                  <span className="truncate max-w-[120px]">
                                    {entry.userName || 'Joueur anonyme'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant="secondary">
                                    {entry.bestTotalPoints} pts
                                  </Badge>
                                  <Users className="h-3 w-3" />
                                  {entry.gamesPlayed}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic p-2">
                            Aucun score pour ce niveau ce mois-ci
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Comment jouer ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">🎯 Objectif</h4>
                <p className="text-muted-foreground">
                  Mémorisez une séquence d'images puis répondez aux questions progressives pour marquer un maximum de points.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">⏱️ Phase 4 Spéciale</h4>
                <p className="text-muted-foreground">
                  Reconstruisez la séquence dans l'ordre inversé en 60 secondes pour débloquer les bonus !
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Modal de défi */}
        <ChallengeModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSendChallenge={handleSendChallenge}
          challengerName={profile?.display_name || user?.email || 'Un ami'}
          gameType="visual"
          difficulty={settings.difficulty}
          isLoading={challengeLoading}
        />
      </div>
    </div>
  );
};