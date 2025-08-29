import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Clock, Target } from 'lucide-react';
import { WordMagicLevel, WordMagicLeaderboard } from '@/types/wordMagicGame';

interface GameSetupProps {
  levels: WordMagicLevel[];
  leaderboard: WordMagicLeaderboard[];
  onStartGame: (level: WordMagicLevel) => void;
  selectedLevel: WordMagicLevel | null;
  onLevelSelect: (level: WordMagicLevel) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({
  levels,
  leaderboard,
  onStartGame,
  selectedLevel,
  onLevelSelect
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'bg-green-100 text-green-800 border-green-200';
      case 'moyen': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'difficile': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          La Magie des Mots
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Formez des mots en reliant les lettres pour remplir la grille croisée. 
          Trouvez tous les mots pour compléter le niveau !
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Level Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Choisir un niveau
              </CardTitle>
              <CardDescription>
                Sélectionnez un niveau pour commencer à jouer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {levels.slice(0, 12).map((level) => (
                  <Card 
                    key={level.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedLevel?.id === level.id 
                        ? 'ring-2 ring-primary shadow-md' 
                        : 'hover:ring-1 hover:ring-primary/50'
                    }`}
                    onClick={() => onLevelSelect(level)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Niveau {level.level_number}</h3>
                        <Badge className={getDifficultyColor(level.difficulty)}>
                          {level.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div>Lettres : {level.letters}</div>
                        <div>{level.solutions.length} mots à trouver</div>
                        {level.bonus_words.length > 0 && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star className="h-3 w-3" />
                            {level.bonus_words.length} mots bonus
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {selectedLevel && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Niveau {selectedLevel.level_number} - {selectedLevel.difficulty}
                      </h3>
                      <p className="text-muted-foreground">
                        Utilisez les lettres : {selectedLevel.letters.split(',').join(', ')}
                      </p>
                    </div>
                    <Button 
                      onClick={() => onStartGame(selectedLevel)}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      Commencer
                    </Button>
                  </div>
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
              <CardDescription>
                Top des meilleurs joueurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div 
                    key={entry.user_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
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
                        <p className="font-medium text-sm">{entry.user_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{entry.total_levels_completed} niveaux</span>
                          {entry.best_completion_time && (
                            <>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(entry.best_completion_time)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{entry.best_score}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
                
                {leaderboard.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun classement pour le moment</p>
                    <p className="text-sm">Soyez le premier à jouer !</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GameSetup;