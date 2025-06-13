
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VoiceAnswerPlayerProps {
  audioUrl: string;
  onDelete?: () => void;
  readOnly?: boolean;
}

const VoiceAnswerPlayer: React.FC<VoiceAnswerPlayerProps> = ({
  audioUrl,
  onDelete,
  readOnly = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  console.log("🎵 VOICE_PLAYER - Render:", { audioUrl, readOnly, hasError });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log("🎵 VOICE_PLAYER - Metadata loaded:", audio.duration);
      setDuration(audio.duration || 0);
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      console.log("🎵 VOICE_PLAYER - Playback ended");
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => {
      console.log("🎵 VOICE_PLAYER - Paused");
      setIsPlaying(false);
    };

    const handlePlay = () => {
      console.log("🎵 VOICE_PLAYER - Playing");
      setIsPlaying(true);
      setHasError(false);
    };

    // Gestion d'erreur améliorée pour éviter les faux positifs sur iPhone
    const handleError = (e: Event) => {
      console.log("🎵 VOICE_PLAYER - Error event:", e, audio.error);
      
      // Ne pas afficher d'erreur si l'utilisateur n'a pas encore interagi
      // Cela évite les erreurs automatiques sur iPhone lors du chargement
      if (!hasUserInteracted) {
        console.log("🎵 VOICE_PLAYER - Ignoring error before user interaction");
        return;
      }

      // Vérifier si c'est une vraie erreur critique
      const error = audio.error;
      if (error && (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 
                   error.code === MediaError.MEDIA_ERR_NETWORK ||
                   error.code === MediaError.MEDIA_ERR_DECODE)) {
        console.error("🎵 VOICE_PLAYER - Critical audio error:", error);
        setHasError(true);
        setIsPlaying(false);
        
        // Afficher le toast seulement pour les erreurs critiques et après interaction utilisateur
        toast({
          title: "Erreur audio",
          description: "Impossible de lire l'enregistrement audio",
          variant: "destructive",
        });
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
    };
  }, [hasUserInteracted]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Marquer que l'utilisateur a interagi
    setHasUserInteracted(true);

    console.log("🎵 VOICE_PLAYER - Play/Pause clicked, current state:", { isPlaying, hasError });

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        setHasError(false);
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
        }
      }
    } catch (error) {
      console.error("🎵 VOICE_PLAYER - Play error:", error);
      setHasError(true);
      setIsPlaying(false);
      
      // Toast d'erreur seulement en cas d'échec réel de lecture
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire l'enregistrement audio",
        variant: "destructive",
      });
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (hasError && hasUserInteracted) {
    return (
      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-red-600 text-sm">Erreur de lecture audio</span>
        {!readOnly && onDelete && (
          <Button
            onClick={onDelete}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <Button
          onClick={handlePlayPause}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={hasError}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Écouter'}</span>
        </Button>
        
        <div className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {!readOnly && onDelete && (
        <Button
          onClick={onDelete}
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Supprimer</span>
        </Button>
      )}

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
      />
    </div>
  );
};

export default VoiceAnswerPlayer;
