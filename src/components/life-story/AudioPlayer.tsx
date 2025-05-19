
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Trash, AlertCircle, RefreshCw, Play, Pause } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { deleteAudio } from '@/utils/audioUploadUtils';
import { Spinner } from '@/components/ui/spinner';
import { validateAudioUrl, preloadAudio } from './utils/audioUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface AudioPlayerProps {
  audioUrl: string;
  chapterId: string;
  questionId: string;
  onDeleteSuccess: () => void;
}

export const AudioPlayer = ({ audioUrl, chapterId, questionId, onDeleteSuccess }: AudioPlayerProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = useIsMobile();
  
  // Vérifier si l'URL est valide
  useEffect(() => {
    const isValid = validateAudioUrl(audioUrl) !== null;
    setIsValidUrl(isValid);
    
    if (!isValid) {
      setAudioError(true);
      setAudioLoaded(false);
    } else {
      // Précharger l'audio pour vérifier sa disponibilité
      const checkAudio = async () => {
        try {
          const isValidAudio = await preloadAudio(audioUrl);
          setAudioError(!isValidAudio);
        } catch (error) {
          console.error("Erreur lors du préchargement de l'audio:", error);
          setAudioError(true);
        } finally {
          setIsRetrying(false);
        }
      };
      
      checkAudio();
    }
  }, [audioUrl, isRetrying]);
  
  // Initialiser l'audio
  useEffect(() => {
    if (!isValidUrl || audioError) return;
    
    const audio = new Audio(audioUrl);
    audio.preload = "metadata";
    audioRef.current = audio;
    
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setAudioLoaded(true);
      setAudioError(false);
    };
    
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const onPlay = () => {
      setIsPlaying(true);
    };
    
    const onPause = () => {
      setIsPlaying(false);
    };
    
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const onError = () => {
      console.error(`Erreur de chargement audio pour l'URL: ${audioUrl}`);
      setAudioError(true);
      setAudioLoaded(false);
    };
    
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl, isValidUrl, audioError]);
  
  const handleDeleteAudio = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      console.log(`Début de la suppression de l'audio pour la question ${questionId}`);
      
      await deleteAudio(
        audioUrl,
        () => {
          onDeleteSuccess();
          toast({
            title: 'Audio supprimé',
            description: 'L\'enregistrement audio a été supprimé avec succès.',
            duration: 2000
          });
        },
        (errorMessage) => {
          toast({
            title: 'Erreur',
            description: errorMessage,
            variant: 'destructive',
            duration: 3000
          });
          setIsDeleting(false);
        }
      );
    } catch (error) {
      console.error('Erreur non gérée lors de la suppression:', error);
      toast({
        title: 'Erreur inattendue',
        description: 'Une erreur s\'est produite lors de la suppression de l\'audio.',
        variant: 'destructive',
        duration: 3000
      });
      setIsDeleting(false);
    }
  };
  
  const handlePlayPause = () => {
    if (!audioRef.current) {
      console.error("Référence audio non disponible");
      return;
    }
    
    try {
      console.log("Tentative de lecture/pause:", isPlaying ? "pause" : "lecture");
      
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Correction: Forcer le chargement avant la lecture
        audioRef.current.load();
        
        // Promesse explicite avec gestion d'erreur
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Lecture démarrée avec succès");
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Erreur lors de la lecture:", error);
              
              // Essayer une deuxième fois après un court délai
              setTimeout(() => {
                if (audioRef.current) {
                  audioRef.current
                    .play()
                    .then(() => console.log("Lecture réussie au second essai"))
                    .catch((error) => {
                      console.error("Échec de la seconde tentative:", error);
                      setAudioError(true);
                      toast({
                        title: "Erreur de lecture",
                        description: "Impossible de lire l'audio. Veuillez réessayer.",
                        variant: "destructive"
                      });
                    });
                }
              }, 300);
            });
        }
      }
    } catch (error) {
      console.error("Exception lors de la lecture/pause:", error);
      setAudioError(true);
      toast({
        title: "Erreur de lecture",
        description: "Une erreur s'est produite lors de la lecture. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };
  
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleRetryLoad = () => {
    setIsRetrying(true);
    setAudioError(false);
    setAudioLoaded(false);
  };

  if (!isValidUrl) {
    return (
      <div className="mt-2 p-3 border rounded-md bg-red-50 text-red-800">
        <div className="text-sm font-medium mb-2">Enregistrement audio indisponible</div>
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>L'URL de l'enregistrement audio est invalide.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDeleteAudio}
          className="mt-2 bg-white text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash className="w-4 h-4 mr-1" /> Supprimer cette référence
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 border rounded-md bg-gray-50">
      <div className="text-sm font-medium mb-2">Enregistrement audio existant</div>
      
      {audioError ? (
        <div className="p-3 mb-3 bg-amber-50 text-amber-700 rounded-md">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="font-medium">Impossible de charger l'audio</span>
          </div>
          <p className="text-sm mb-2">Le fichier audio est peut-être inaccessible ou a été supprimé.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryLoad}
            className="bg-white"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRetrying ? 'animate-spin' : ''}`} /> 
            {isRetrying ? 'Tentative...' : 'Réessayer'}
          </Button>
        </div>
      ) : (
        <div className="relative mb-3">
          {!audioLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 z-10 rounded">
              <Spinner className="h-6 w-6 border-gray-500" />
            </div>
          )}
          
          {isMobile && audioLoaded ? (
            <div className="p-3 border rounded-md bg-white">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 flex-shrink-0 active:bg-blue-100"
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? "Pause" : "Lecture"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <div className="w-full">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    className="w-full accent-blue-600"
                    onChange={handleSliderChange}
                  />
                </div>
                <div className="text-xs text-gray-500 min-w-[40px] text-right">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>
          ) : (
            <audio 
              src={audioUrl} 
              controls 
              className={`w-full ${!audioLoaded ? 'opacity-0' : ''}`}
              onError={() => setAudioError(true)}
              onLoadedData={() => setAudioLoaded(true)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              ref={audioRef}
            />
          )}
        </div>
      )}
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDeleteAudio}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          disabled={isDeleting || isPlaying}
        >
          {isDeleting ? (
            <>
              <Spinner className="w-3 h-3 mr-2 border-current border-t-transparent" />
              Suppression...
            </>
          ) : (
            <>
              <Trash className="w-4 h-4 mr-1" /> Supprimer l'audio
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AudioPlayer;
