
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAccessibleAudioUrl } from '@/utils/audioUploadUtils';

interface VoiceAnswerPlayerProps {
  audioUrl: string;
  onDelete?: () => void;
  readOnly?: boolean;
  shouldLog?: boolean;
}

const VoiceAnswerPlayer: React.FC<VoiceAnswerPlayerProps> = ({
  audioUrl,
  onDelete,
  readOnly = false,
  shouldLog = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [accessibleUrl, setAccessibleUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  if (shouldLog) {
    console.log("🎵 VOICE_PLAYER - Render:", { audioUrl, accessibleUrl, readOnly, hasError, isLoadingUrl, needsUserInteraction });
  }

  // Détecter iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Convertir le chemin relatif en URL accessible
  useEffect(() => {
    const convertToAccessibleUrl = async () => {
      setIsLoadingUrl(true);
      
      // Si c'est déjà une URL complète (blob, http, etc.), l'utiliser directement
      if (audioUrl.startsWith('blob:') || audioUrl.startsWith('http') || audioUrl.startsWith('data:')) {
        if (shouldLog) {
          console.log("🎵 VOICE_PLAYER - URL déjà accessible:", audioUrl);
        }
        setAccessibleUrl(audioUrl);
        setIsLoadingUrl(false);
        return;
      }
      
      // Sinon, convertir le chemin relatif en URL publique
      if (shouldLog) {
        console.log("🎵 VOICE_PLAYER - Conversion du chemin relatif:", audioUrl);
      }
      
      try {
        const publicUrl = await getAccessibleAudioUrl(audioUrl);
        if (publicUrl) {
          if (shouldLog) {
            console.log("🎵 VOICE_PLAYER - URL publique générée:", publicUrl);
          }
          setAccessibleUrl(publicUrl);
        } else {
          console.error("🎵 VOICE_PLAYER - Impossible de générer l'URL publique pour:", audioUrl);
          setHasError(true);
          toast({
            title: "Erreur audio",
            description: "Impossible de charger l'enregistrement audio",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("🎵 VOICE_PLAYER - Erreur lors de la conversion d'URL:", error);
        setHasError(true);
        toast({
          title: "Erreur audio",
          description: "Impossible de charger l'enregistrement audio",
          variant: "destructive",
        });
      } finally {
        setIsLoadingUrl(false);
      }
    };

    convertToAccessibleUrl();
  }, [audioUrl, shouldLog]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !accessibleUrl) return;

    const handleLoadedMetadata = () => {
      if (shouldLog) {
        console.log("🎵 VOICE_PLAYER - Metadata loaded:", audio.duration);
      }
      setDuration(audio.duration || 0);
      setHasError(false);
    };

    const handleCanPlay = () => {
      if (shouldLog) {
        console.log("🎵 VOICE_PLAYER - Can play - audio ready");
      }
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (shouldLog) {
        console.log("🎵 VOICE_PLAYER - Playback ended");
      }
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => {
      if (shouldLog) {
        console.log("🎵 VOICE_PLAYER - Paused");
      }
      setIsPlaying(false);
    };

    const handlePlay = () => {
      if (shouldLog) {
        console.log("🎵 VOICE_PLAYER - Playing");
      }
      setIsPlaying(true);
      setHasError(false);
      setNeedsUserInteraction(false);
    };

    const handleError = (e: Event) => {
      if (shouldLog) {
        console.log("🎵 VOICE_PLAYER - Error event:", e, audio.error);
      }
      
      // Ne traiter les erreurs que si l'utilisateur a interagi ET que c'est une erreur critique
      if (hasUserInteracted && audio.error && 
          (audio.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 
           audio.error.code === MediaError.MEDIA_ERR_DECODE)) {
        console.error("🎵 VOICE_PLAYER - Critical audio error:", audio.error);
        
        setHasError(true);
        setIsPlaying(false);
        
        toast({
          title: "Erreur audio",
          description: "Impossible de lire l'enregistrement audio",
          variant: "destructive",
        });
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
    };
  }, [hasUserInteracted, shouldLog, accessibleUrl]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !accessibleUrl) return;

    // Marquer que l'utilisateur a interagi
    setHasUserInteracted(true);

    if (shouldLog) {
      console.log("🎵 VOICE_PLAYER - Play/Pause clicked, current state:", { 
        isPlaying, 
        hasError, 
        accessibleUrl, 
        needsUserInteraction,
        readyState: audio.readyState
      });
    }

    try {
      if (isPlaying) {
        audio.pause();
        return;
      }

      // Reset des états d'erreur
      setHasError(false);
      setNeedsUserInteraction(false);
      
      // Tentative de lecture directe - plus de préparation complexe
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
      }
      
    } catch (error) {
      console.error("🎵 VOICE_PLAYER - Play error:", error);
      
      // Gestion spécifique de NotAllowedError sur iOS
      if (error instanceof DOMException && error.name === 'NotAllowedError' && isIOS) {
        if (shouldLog) {
          console.log("🎵 VOICE_PLAYER - iOS NotAllowedError, needs user interaction");
        }
        setNeedsUserInteraction(true);
        // Ne pas afficher d'erreur, juste indiquer qu'il faut cliquer à nouveau
        return;
      }
      
      // Pour les autres erreurs
      setHasError(true);
      setIsPlaying(false);
      
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire l'enregistrement audio. Essayez à nouveau.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Affichage pendant le chargement de l'URL
  if (isLoadingUrl) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="animate-pulse w-8 h-8 bg-gray-300 rounded"></div>
          <span className="text-sm text-gray-500">Chargement de l'audio...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
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
          disabled={!accessibleUrl}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isPlaying ? 'Pause' : 'Écouter'}
          </span>
        </Button>
        
        <div className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        {needsUserInteraction && isIOS && (
          <div className="text-xs text-blue-500">
            Cliquez à nouveau
          </div>
        )}
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

      {accessibleUrl && (
        <audio
          ref={audioRef}
          src={accessibleUrl}
          preload="metadata"
        />
      )}
    </div>
  );
};

export default VoiceAnswerPlayer;
