import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, CheckCircle, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface MusicQuizCardProps {
  activity: {
    id: string;
    title: string;
    link: string;
    activity_type: string;
    thumbnail_url?: string;
    activity_date?: string;
    sub_activity_tag_id?: string;
    audio_url?: string;
  };
  subtag?: {
    name: string;
  };
  onAnswer: (answer: string) => void;
  gameState: 'waiting' | 'playing' | 'answered';
  correctAnswer?: string;
  showAnswer?: boolean;
}

export function MusicQuizCard({ 
  activity, 
  subtag, 
  onAnswer, 
  gameState, 
  correctAnswer, 
  showAnswer 
}: MusicQuizCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = () => {
    if (audioRef.current && gameState === 'playing') {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
  };

  // Gestion des événements audio
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  // Pause l'audio quand une réponse est donnée
  useEffect(() => {
    if (audioRef.current && gameState === 'answered' && isPlaying) {
      audioRef.current.pause();
    }
  }, [gameState, isPlaying]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      gameState === 'playing' && "ring-2 ring-blue-500",
      gameState === 'answered' && showAnswer && "ring-2 ring-green-500"
    )}>
      <div className="relative">
        {/* Image de couverture */}
        <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          {activity.thumbnail_url ? (
            <img
              src={activity.thumbnail_url}
              alt={activity.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Volume2 className="h-16 w-16 text-white" />
          )}
          
          {/* Overlay de lecture */}
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePlay}
              disabled={gameState !== 'playing'}
              className="w-20 h-20 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-2 border-white"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
          </div>
        </div>

        {/* Badge de statut */}
        <div className="absolute top-3 left-3">
          <Badge variant={gameState === 'answered' ? 'default' : 'secondary'}>
            {gameState === 'waiting' && <Clock className="h-3 w-3 mr-1" />}
            {gameState === 'playing' && <Play className="h-3 w-3 mr-1" />}
            {gameState === 'answered' && <CheckCircle className="h-3 w-3 mr-1" />}
            {gameState === 'waiting' && 'En attente'}
            {gameState === 'playing' && 'À l\'écoute'}
            {gameState === 'answered' && 'Répondu'}
          </Badge>
        </div>

        {/* Sous-tag */}
        {subtag && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-white bg-opacity-90">
              {subtag.name}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Titre */}
        <h3 className="text-lg font-semibold line-clamp-2">
          {activity.title}
        </h3>

        {/* Audio Player */}
        {activity.audio_url && (
          <div className="space-y-3">
            <audio
              ref={audioRef}
              src={activity.audio_url}
              preload="metadata"
              className="hidden"
            />
            
            {/* Contrôles audio personnalisés */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlay}
                disabled={gameState !== 'playing'}
                className="flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <div className="flex-1 flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {isPlaying ? 'En cours de lecture...' : 'Blind test audio'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Message si pas d'audio */}
        {!activity.audio_url && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Aucun fichier audio disponible pour ce quiz
            </p>
          </div>
        )}

        {/* Réponse */}
        {showAnswer && correctAnswer && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              Réponse : {correctAnswer}
            </p>
          </div>
        )}

        {/* Date */}
        {activity.activity_date && (
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {new Date(activity.activity_date).toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>
    </Card>
  );
}