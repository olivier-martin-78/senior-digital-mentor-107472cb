
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = useIsMobile();
  
  // Vérifier et précharger l'audio
  useEffect(() => {
    let mounted = true;
    let audioElement: HTMLAudioElement | null = null;
    
    if (!validateAudioUrl(audioUrl)) {
      setHasError(true);
      setIsLoading(false);
      return;
    }
    
    const checkAudio = async () => {
      try {
        console.log("Vérification de l'audio:", audioUrl);
        setIsLoading(true);
        
        // Créer un élément audio pour tester le chargement
        audioElement = new Audio();
        
        // Définir les gestionnaires d'événements
        const onLoadedData = () => {
          if (mounted) {
            console.log("Audio préchargé avec succès");
            setIsLoading(false);
            setHasError(false);
            setDuration(audioElement?.duration || 0);
          }
        };
        
        const onError = (e: ErrorEvent) => {
          console.error("Erreur lors du préchargement audio:", e);
          if (mounted) {
            setIsLoading(false);
            setHasError(true);
            
            toast({
              title: "Problème de lecture audio",
              description: "L'enregistrement n'a pas pu être chargé correctement",
              variant: "destructive"
            });
          }
        };
        
        // Ajouter les écouteurs d'événements
        audioElement.addEventListener('loadeddata', onLoadedData);
        audioElement.addEventListener('error', () => onError(new ErrorEvent("error")));
        
        // Charger l'audio avec un délai pour éviter les problèmes de chargement
        audioElement.preload = "auto";
        setTimeout(() => {
          if (mounted) {
            audioElement!.src = audioUrl;
            audioElement!.load();
          }
        }, 300);
        
        // Définir un timeout de sécurité
        setTimeout(() => {
          if (mounted && isLoading) {
            console.warn("Timeout du chargement audio");
            setIsLoading(false);
            if (!hasError) {
              // Essayer encore une fois de charger l'audio
              setHasError(false);
            }
          }
        }, 5000);
        
      } catch (error) {
        console.error("Exception lors de la vérification de l'audio:", error);
        if (mounted) {
          setIsLoading(false);
          setHasError(true);
        }
      }
    };
    
    checkAudio();
    
    return () => {
      mounted = false;
      // Nettoyer les écouteurs d'événements
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        audioElement.remove();
      }
    };
  }, [audioUrl]);
  
  // Initialiser l'audio
  useEffect(() => {
    // Si l'URL n'est pas valide ou s'il y a une erreur, ne pas initialiser
    if (!validateAudioUrl(audioUrl) || hasError) {
      return;
    }
    
    // Créer un nouvel élément audio
    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audioRef.current = audio;
    
    const onLoadedMetadata = () => {
      console.log("Métadonnées audio chargées, durée:", audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const onPlay = () => {
      console.log("Lecture démarrée");
      setIsPlaying(true);
    };
    
    const onPause = () => {
      console.log("Lecture en pause");
      setIsPlaying(false);
    };
    
    const onEnded = () => {
      console.log("Lecture terminée");
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const onError = (e: Event) => {
      console.error("Erreur de lecture audio:", e);
      setHasError(true);
      setIsLoading(false);
      
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire cet enregistrement audio. Il pourrait être corrompu ou inaccessible.",
        variant: "destructive"
      });
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
      audio.load();
    } catch (error) {
      console.error("Erreur lors du chargement de l'audio:", error);
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
  }, [audioUrl, hasError]);
  
  const handlePlayPause = () => {
    if (!audioRef.current) {
      console.error("Référence audio non disponible");
      return;
    }
    
    try {
      if (isPlaying) {
        console.log("Pause de la lecture");
        audioRef.current.pause();
      } else {
        console.log("Début de la lecture");
        // Réinitialiser l'audio si nécessaire
        if (audioRef.current.error) {
          console.log("Réinitialisation de l'audio après erreur");
          audioRef.current.src = audioUrl;
          audioRef.current.load();
        }
        
        // Utiliser une promesse pour la lecture avec gestion d'erreur
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Lecture démarrée avec succès");
            })
            .catch((error) => {
              console.error("Erreur lors de la lecture:", error);
              
              // Réessayer après un court délai
              setTimeout(() => {
                if (audioRef.current) {
                  console.log("Nouvelle tentative de lecture");
                  // Réinitialiser l'audio
                  audioRef.current.src = audioUrl;
                  audioRef.current.load();
                  
                  audioRef.current
                    .play()
                    .then(() => console.log("Lecture réussie au second essai"))
                    .catch((secondError) => {
                      console.error("Échec de la seconde tentative:", secondError);
                      setHasError(true);
                      toast({
                        title: "Erreur de lecture",
                        description: "Impossible de lire l'audio. Veuillez réessayer ou enregistrer à nouveau.",
                        variant: "destructive"
                      });
                    });
                }
              }, 500);
            });
        }
      }
    } catch (error) {
      console.error("Exception lors de la lecture/pause:", error);
      setHasError(true);
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
            <span>Impossible de charger l'enregistrement audio. Essayez de rafraîchir la page ou d'enregistrer à nouveau.</span>
          </div>
        ) : (
          <div className={`rounded-md border border-gray-200 p-3 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
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
                onError={() => setHasError(true)}
                onLoadedData={() => {
                  setIsLoading(false);
                  setHasError(false);
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
