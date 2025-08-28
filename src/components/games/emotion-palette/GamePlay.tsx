import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Zap, Clock } from 'lucide-react';
import { EmotionGameQuestion, GameStats } from '@/types/emotionGame';

interface GamePlayProps {
  currentQuestion: EmotionGameQuestion;
  currentQuestionIndex: number;
  totalQuestions: number;
  shuffledLabels: string[];
  selectedEmotion: string;
  selectedIntensity: string;
  showIntensityQuestion: boolean;
  gameStats: GameStats;
  progress: number;
  onEmotionSelect: (emotion: string) => void;
  onIntensitySelect: (intensity: string) => void;
}

export const GamePlay: React.FC<GamePlayProps> = ({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  shuffledLabels,
  selectedEmotion,
  selectedIntensity,
  showIntensityQuestion,
  gameStats,
  progress,
  onEmotionSelect,
  onIntensitySelect
}) => {
  const intensityOptions = ['Puissante', 'Intermédiaire', 'Modérée'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Game Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">La Palette des Émotions</h1>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {gameStats.totalScore} points
            </Badge>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1}/{totalQuestions}
            </Badge>
          </div>
        </div>
        
        <Progress value={progress} className="w-full" />
      </div>

      {/* Current Image */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <img
              src={currentQuestion.image.image_url}
              alt="Émotion à identifier"
              className="w-full h-96 object-cover"
            />
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              {showIntensityQuestion ? 'Quelle intensité ?' : 'Quelle émotion ?'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Phase */}
      {!showIntensityQuestion ? (
        /* Emotion Selection */
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                  Quelle émotion voyez-vous dans cette image ?
                </h2>
                <p className="text-muted-foreground">
                  Sélectionnez l'étiquette correspondante (2 points)
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {shuffledLabels.map((emotion) => (
                  <Button
                    key={emotion}
                    variant={selectedEmotion === emotion ? "default" : "outline"}
                    onClick={() => onEmotionSelect(emotion)}
                    className={`h-auto p-3 text-sm transition-all duration-200 ${
                      selectedEmotion === emotion
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                        : 'hover:scale-105 hover:shadow-md'
                    }`}
                    disabled={!!selectedEmotion}
                  >
                    {emotion}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Intensity Selection */
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">Bonne réponse !</span>
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  Quelle est l'intensité de cette émotion ?
                </h2>
                <p className="text-muted-foreground">
                  Choisissez le niveau d'intensité (1 point bonus)
                </p>
              </div>
              
              <div className="flex justify-center gap-4">
                {intensityOptions.map((intensity) => (
                  <Button
                    key={intensity}
                    variant={selectedIntensity === intensity ? "default" : "outline"}
                    onClick={() => onIntensitySelect(intensity)}
                    className={`px-6 py-4 text-base transition-all duration-200 ${
                      selectedIntensity === intensity
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                        : 'hover:scale-105 hover:shadow-md'
                    } ${
                      intensity === 'Puissante' 
                        ? 'border-red-300 hover:border-red-400'
                        : intensity === 'Intermédiaire'
                        ? 'border-yellow-300 hover:border-yellow-400'
                        : 'border-green-300 hover:border-green-400'
                    }`}
                    disabled={!!selectedIntensity}
                  >
                    <div className="flex items-center gap-2">
                      {intensity === 'Puissante' && <div className="w-3 h-3 bg-red-500 rounded-full" />}
                      {intensity === 'Intermédiaire' && <div className="w-3 h-3 bg-yellow-500 rounded-full" />}
                      {intensity === 'Modérée' && <div className="w-3 h-3 bg-green-500 rounded-full" />}
                      {intensity}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Footer */}
      <div className="flex justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Heart className="h-4 w-4" />
          <span>Émotions: {gameStats.emotionCorrect}/{currentQuestionIndex + (selectedEmotion ? 1 : 0)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4" />
          <span>Intensités: {gameStats.intensityCorrect}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>Score: {gameStats.totalScore} points</span>
        </div>
      </div>
    </div>
  );
};