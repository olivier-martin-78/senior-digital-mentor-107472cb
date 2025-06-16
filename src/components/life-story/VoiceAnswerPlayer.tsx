
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
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  if (shouldLog) {
    console.log("🎵 VOICE_PLAYER - Render:", { audioUrl, accessibleUrl, readOnly, hasError, isLoadingUrl, isPreparingAudio });
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
      setIsPreparingAudio(false);
      setHasError(false);
    };

    const handleCanPlayThrough = () => {
      if (shouldLog) {
        console.log("🎵 VOICE_PLAYER - Can play through - audio fully ready");
      }
      setIsPreparingAudio(false);
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
      setRetryCount(0); // Reset retry count on successful play
    };

    // Gestion d'erreur améliorée avec retry pour iOS
    const handleError = (e: Event) => {
      if (shouldLog) {
        console.log("🎵 VOICE_PLAYER - Error event:", e, audio.error);
      }
      
      // Ne pas afficher d'erreur si l'utilisateur n'a pas encore interagi
      if (!hasUserInteracted) {
        if (shouldLog) {
          console.log("🎵 VOICE_PLAYER - Ignoring error before user interaction");
        }
        return;
      }

      // Vérifier si c'est une vraie erreur critique
      const error = audio.error;
      if (error && (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 
                   error.code === MediaError.MEDIA_ERR_NETWORK ||
                   error.code === MediaError.MEDIA_ERR_DECODE)) {
        console.error("🎵 VOICE_PLAYER - Critical audio error:", error);
        
        // Sur iOS, ne montrer l'erreur qu'après plusieurs tentatives
        if (isIOS && retryCount < 2) {
          if (shouldLog) {
            console.log("🎵 VOICE_PLAYER - iOS retry, attempt:", retryCount + 1);
          }
          setRetryCount(prev => prev + 1);
          setIsPreparingAudio(true);
          // Recharger l'audio après un court délai
          setTimeout(() => {
            audio.load();
          }, 100);
          return;
        }
        
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
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
    };
  }, [hasUserInteracted, shouldLog, accessibleUrl, isIOS, retryCount]);

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
        isPreparingAudio,
        retryCount,
        readyState: audio.readyState
      });
    }

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        setHasError(false);
        
        // Sur iOS, ajouter une préparation si l'audio n'est pas prêt
        if (isIOS && audio.readyState < 2) {
          setIsPreparingAudio(true);
          if (shouldLog) {
            console.log("🎵 VOICE_PLAYER - iOS: preparing audio for playback");
          }
          
          // Attendre que l'audio soit prêt avant de jouer
          const waitForReady = () => {
            return new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Audio preparation timeout'));
              }, 3000);
              
              const checkReady = () => {
                if (audio.readyState >= 2) {
                  clearTimeout(timeout);
                  setIsPreparingAudio(false);
                  resolve();
                } else {
                  setTimeout(checkReady, 50);
                }
              };
              
              checkReady();
            });
          };
          
          try {
            await waitForReady();
          } catch (error) {
            if (shouldLog) {
              console.log("🎵 VOICE_PLAYER - Audio preparation timeout, trying anyway");
            }
            setIsPreparingAudio(false);
          }
        }
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
        }
      }
    } catch (error) {
      console.error("🎵 VOICE_PLAYER - Play error:", error);
      
      // Sur iOS, tenter un retry avant d'afficher l'erreur
      if (isIOS && retryCount < 2) {
        if (shouldLog) {
          console.log("🎵 VOICE_PLAYER - iOS play error, retrying:", retryCount + 1);
        }
        setRetryCount(prev => prev + 1);
        setIsPreparingAudio(true);
        
        // Recharger et réessayer après un délai
        setTimeout(() => {
          audio.load();
          setTimeout(() => {
            setIsPreparingAudio(false);
            handlePlayPause(); // Réessayer
          }, 200);
        }, 100);
        
        return;
      }
      
      setHasError(true);
      setIsPlaying(false);
      setIsPreparingAudio(false);
      
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

  if (hasError && hasUserInteracted && retryCount >= 2) {
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

  const isButtonDisabled = hasError || !accessibleUrl || isPreparingAudio;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <Button
          onClick={handlePlayPause}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={isButtonDisabled}
        >
          {isPreparingAudio ? (
            <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isPreparingAudio ? 'Préparation...' : isPlaying ? 'Pause' : 'Écouter'}
          </span>
        </Button>
        
        <div className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        {isIOS && retryCount > 0 && (
          <div className="text-xs text-orange-500">
            Tentative {retryCount}/2
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
          preload={isIOS ? "auto" : "metadata"}
        />
      )}
    </div>
  );
};

export default VoiceAnswerPlayer;
