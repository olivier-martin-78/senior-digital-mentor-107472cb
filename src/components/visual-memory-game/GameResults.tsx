import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Target, Star, RotateCcw, Settings } from 'lucide-react';
import { GameResult } from '@/types/visualMemoryGame';
import { Link } from 'react-router-dom';

interface GameResultsProps {
  result: GameResult;
  onPlayAgain: () => void;
}

export const GameResults: React.FC<GameResultsProps> = ({
  result,
  onPlayAgain
}) => {
  const getResultMessage = () => {
    const accuracy = result.accuracy;
    
    if (accuracy >= 90) {
      return {
        title: "🏆 Performance EXCEPTIONNELLE !",
        message: "Vous avez une mémoire visuelle remarquable !",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50"
      };
    } else if (accuracy >= 75) {
      return {
        title: "🥈 Très bonne performance !",
        message: "Votre mémoire visuelle est excellente !",
        color: "text-green-600",
        bgColor: "bg-green-50"
      };
    } else if (accuracy >= 60) {
      return {
        title: "🥉 Bonne performance !",
        message: "Continuez à vous entraîner pour progresser !",
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      };
    } else {
      return {
        title: "💪 À améliorer",
        message: "L'entraînement est la clé du succès !",
        color: "text-orange-600",
        bgColor: "bg-orange-50"
      };
    }
  };

  const resultInfo = getResultMessage();
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getDifficultyInfo = () => {
    switch (result.difficulty) {
      case 'beginner':
        return { label: 'Débutant', icon: '🟢', color: 'bg-green-500' };
      case 'intermediate':
        return { label: 'Intermédiaire', icon: '🟡', color: 'bg-yellow-500' };
      case 'advanced':
        return { label: 'Avancé', icon: '🔴', color: 'bg-red-500' };
    }
  };

  const difficultyInfo = getDifficultyInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* En-tête des résultats */}
        <Card className={`${resultInfo.bgColor} border-2`}>
          <CardHeader className="text-center">
            <CardTitle className={`text-3xl font-bold ${resultInfo.color}`}>
              {resultInfo.title}
            </CardTitle>
            <p className="text-lg text-muted-foreground mt-2">
              {resultInfo.message}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="secondary" className={`${difficultyInfo.color} text-white`}>
                {difficultyInfo.icon} {difficultyInfo.label}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Score principal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Score Final
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  {result.totalScore}
                </div>
                <p className="text-muted-foreground">points au total</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="font-bold text-lg">{result.phase1Score}</div>
                  <div className="text-muted-foreground">Phase 1</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="font-bold text-lg">{result.phase2Score}</div>
                  <div className="text-muted-foreground">Phase 2</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="font-bold text-lg">{result.phase3Score}</div>
                  <div className="text-muted-foreground">Phase 3</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="font-bold text-lg">{result.phase4Score}</div>
                  <div className="text-muted-foreground">Phase 4</div>
                </div>
              </div>

              {result.bonusPoints > 0 && (
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    +{result.bonusPoints}
                  </div>
                  <div className="text-sm text-yellow-700">
                    🎉 Points bonus !
                  </div>
                  {result.phase4Time && (
                    <div className="text-xs text-yellow-600 mt-1">
                      Temps Phase 4: {formatTime(result.phase4Time)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques détaillées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">Précision</span>
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {result.accuracy.toFixed(0)}%
                  </div>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Temps total</span>
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {formatTime(result.totalTime)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Questions répondues:</span>
                  <span className="font-medium">{result.totalQuestions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Réponses correctes:</span>
                  <span className="font-medium text-green-600">{result.correctAnswers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phase 4 complétée:</span>
                  <span className={`font-medium ${result.completedPhase4 ? 'text-green-600' : 'text-orange-600'}`}>
                    {result.completedPhase4 ? '✅ Oui' : '❌ Non'}
                  </span>
                </div>
                {result.phase4Attempts > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tentatives Phase 4:</span>
                    <span className="font-medium">{result.phase4Attempts}/3</span>
                  </div>
                )}
              </div>

              {result.completedPhase4 && result.bonusPoints > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Bonus débloqué!</span>
                  </div>
                  <div className="text-xs text-green-600">
                    Séquence parfaite + bonus temps
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onPlayAgain}
                size="lg"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                Rejouer
              </Button>
              
              <Button
                onClick={onPlayAgain}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Settings className="h-5 w-5" />
                Changer de difficulté
              </Button>
              
              <Button
                asChild
                variant="secondary"
                size="lg"
              >
                <Link to="/activities/games">
                  ← Retour aux jeux
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Message d'encouragement */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">💡 Conseils pour améliorer votre score</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <strong>🧠 Mémorisation:</strong> Créez des associations mentales entre les images
                </div>
                <div>
                  <strong>👀 Observation:</strong> Concentrez-vous sur les détails et les couleurs
                </div>
                <div>
                  <strong>⚡ Vitesse:</strong> La Phase 4 récompense la rapidité et la précision
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};