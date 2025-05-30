
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash, Download, AlertCircle, Play, Pause } from 'lucide-react';
import { handleExportAudio, validateAudioUrl, preloadAudio } from './utils/audioUtils';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface VoiceAnswerPlayerProps {
  audioUrl: string;
  onDelete: () => void;
}

export const VoiceAnswerPlayer: React.FC<VoiceAnswerPlayerProps> = ({
  audioUrl,
  onDelete
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [isStabilizing, setIsStabilizing] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stabilizationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  
  const MAX_LOAD_ATTEMPTS = 3;
  const STABILIZATION_DELAY = 2000; // 2 secondes de stabilisation
  const RETRY_DELAY = 1000; // 1 seconde entre les tentatives
  
  // Phase de stabilisation et chargement de l'audio
  useEffect(() => {
    let mounted = true;
    
    if (!validateAudioUrl(audioUrl)) {
      setHasError(true);
      setIsLoading(false);
      setIsStabilizing(false);
      return;
    }
    
    console.log("Début de la stabilisation audio pour:", audioUrl);
    
    // Phase de stabilisation - attendre que l'audio soit accessible
    stabilizationTimeoutRef.current = setTimeout(() => {
      if (mounted) {
        setIsStabilizing(false);
        startAudioLoad();
      }
    }, STABILIZATION_DELAY);
    
    const startAudioLoad = () => {
      if (!mounted) return;
      
      console.log(`Tentative de chargement audio ${loadAttempts + 1}/${MAX_LOAD_ATTEMPTS}`);
      
      // Créer un nouvel élément audio
      const audio = new Audio();
      audio.preload = "auto";
      audioRef.current = audio;
      
      const onLoadedMetadata = () => {
        if (mounted) {
          console.log("Audio chargé avec succès, durée:", audio.duration);
          setDuration(audio.duration);
          setIsLoading(false);
          setHasError(false);
          setLoadAttempts(0);
        }
      };
      
      const onTimeUpdate = () => {
        if (mounted) {
          setCurrentTime(audio.currentTime);
        }
      };
      
      const onPlay = () => {
        if (mounted) {
          setIsPlaying(true);
        }
      };
      
      const onPause = () => {
        if (mounted) {
          setIsPlaying(false);
        }
      };
      
      const onEnded = () => {
        if (mounted) {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      };
      
      const onError = (e: Event) => {
        if (!mounted) return;
        
        console.error(`Erreur de chargement audio (tentative ${loadAttempts + 1}):`, e);
        
        if (loadAttempts < MAX_LOAD_ATTEMPTS - 1) {
          // Tentative de rechargement
          setLoadAttempts(prev => prev + 1);
          retryTimeoutRef.current = setTimeout(() => {
            if (mounted) {
              startAudioLoad();
            }
          }, RETRY_DELAY);
        } else {
          // Échec définitif après toutes les tentatives
          console.error("Échec définitif du chargement audio après", MAX_LOAD_ATTEMPTS, "tentatives");
          setHasError(true);
          setIsLoading(false);
        }
      };
      
      // Ajouter les écouteurs d'événements
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      
      // Charger l'audio
      try {
        audio.src = audioUrl;
        audio.load();
      } catch (error) {
        console.error("Exception lors du chargement:", error);
        onError(new Event('error'));
      }
      
      // Nettoyer lors du démontage
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
    };
    
    return () => {
      mounted = false;
      if (stabilizationTimeoutRef.current) {
        clearTimeout(stabilizationTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [audioUrl]);
  
  const handlePlayPause = () => {
    if (!audioRef.current || hasError) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Erreur lors de la lecture:", error);
            toast({
              title: "Erreur de lecture",
              description: "Impossible de lire l'audio. Veuillez réessayer.",
              variant: "destructive"
            });
          });
        }
      }
    } catch (error) {
      console.error("Exception lors de la lecture:", error);
    }
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || hasError) return;
    
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    try {
      audioRef.current.currentTime = newTime;
    } catch (error) {
      console.error("Erreur lors de la modification de la position:", error);
    }
  };
  
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleDelete = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onDelete();
  };
  
  const handleExport = () => {
    handleExportAudio(audioUrl);
  };
  
  // Affichage en cours de stabilisation
  if (isStabilizing) {
    return (
      <div className="rounded-md border border-gray-200 p-3">
        <div className="flex items-center justify-center py-2">
          <Spinner className="h-5 w-5 border-gray-500 mr-2" />
          <span className="text-sm text-gray-600">Préparation de la lecture...</span>
        </div>
      </div>
    );
  }
  
  // Si l'URL n'est pas valide, afficher un message d'erreur
  if (!validateAudioUrl(audioUrl)) {
    return (
      <div className="p-3 bg-red-50 text-red-800 rounded-md flex items-center mb-2">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
        <span>URL audio invalide. L'enregistrement pourrait avoir été supprimé.</span>
      </div>
    );
  }
  
  return (
    <div>
      <div className="relative mb-2">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 z-10 rounded-md">
            <Spinner className="h-6 w-6 border-gray-500" />
          </div>
        )}
        
        {hasError ? (
          <div className="p-3 bg-amber-50 text-amber-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>Impossible de charger l'enregistrement. L'audio est peut-être encore en cours de traitement. Veuillez patienter quelques instants et actualiser si nécessaire.</span>
          </div>
        ) : (
          <div className={`rounded-md border border-gray-200 p-3 ${isLoading ? 'opacity-60' : 'opacity-100'} transition-opacity`}>
            {isMobile ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 flex-shrink-0 active:bg-blue-100"
                    disabled={isLoading || hasError}
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
                      disabled={isLoading || hasError || duration === 0}
                    />
                  </div>
                  <div className="text-xs text-gray-500 min-w-[40px] text-right">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>
            ) : (
              <audio 
                controls 
                className="w-full"
                src={audioUrl}
                onError={() => {
                  console.log("Erreur audio détectée par l'élément audio natif");
                }}
                onLoadedData={() => {
                  console.log("Audio natif chargé");
                }}
              />
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExport}
          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          disabled={isPlaying || isLoading || hasError}
        >
          <Download className="w-4 h-4 mr-1" /> Exporter l'audio
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          disabled={isPlaying || isLoading}
        >
          <Trash className="w-4 h-4 mr-1" /> Supprimer
        </Button>
      </div>
    </div>
  );
};

export default VoiceAnswerPlayer;
