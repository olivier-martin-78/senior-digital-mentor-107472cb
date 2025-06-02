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
  readOnly?: boolean;
}

export const VoiceAnswerPlayer: React.FC<VoiceAnswerPlayerProps> = ({
  audioUrl,
  onDelete,
  readOnly = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  
  const MAX_LOAD_ATTEMPTS = 3;
  const RETRY_DELAY = 2000; // 2 secondes entre les tentatives
  
  // DEBUG: Log l'état initial
  console.log('🎵 VoiceAnswerPlayer - Initialisation:', {
    audioUrl,
    isValidUrl: validateAudioUrl(audioUrl),
    isLoading,
    hasError,
    urlLength: audioUrl?.length,
    bucketInfo: audioUrl?.includes('diary_media') ? 'diary_media' : audioUrl?.includes('life-story-audios') ? 'life-story-audios' : 'unknown',
    readOnly
  });
  
  // Chargement de l'audio avec gestion d'erreur améliorée
  useEffect(() => {
    let mounted = true;
    
    console.log('🎵 VoiceAnswerPlayer - useEffect principal déclenché:', { audioUrl, mounted, loadAttempts });
    
    if (!validateAudioUrl(audioUrl)) {
      console.log('🎵 VoiceAnswerPlayer - ❌ URL audio invalide:', audioUrl);
      setHasError(true);
      setIsLoading(false);
      return;
    }
    
    const startAudioLoad = () => {
      if (!mounted) {
        console.log('🎵 VoiceAnswerPlayer - startAudioLoad: composant démonté');
        return;
      }
      
      console.log(`🎵 VoiceAnswerPlayer - Tentative chargement ${loadAttempts + 1}/${MAX_LOAD_ATTEMPTS} pour URL:`, audioUrl);
      
      // Créer un nouvel élément audio
      const audio = new Audio();
      audio.preload = "auto";
      audio.crossOrigin = "anonymous"; // Ajouter pour éviter les problèmes CORS
      audioRef.current = audio;
      
      const onLoadedMetadata = () => {
        if (mounted) {
          console.log("🎵 VoiceAnswerPlayer - ✅ Audio chargé avec succès, durée:", audio.duration, "secondes");
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
          console.log('🎵 VoiceAnswerPlayer - ▶️ Lecture démarrée');
          setIsPlaying(true);
        }
      };
      
      const onPause = () => {
        if (mounted) {
          console.log('🎵 VoiceAnswerPlayer - ⏸️ Lecture en pause');
          setIsPlaying(false);
        }
      };
      
      const onEnded = () => {
        if (mounted) {
          console.log('🎵 VoiceAnswerPlayer - ⏹️ Lecture terminée');
          setIsPlaying(false);
          setCurrentTime(0);
        }
      };
      
      const onError = (e: Event) => {
        if (!mounted) return;
        
        const target = e.target as HTMLAudioElement;
        const errorCode = target?.error?.code;
        const errorMessage = target?.error?.message;
        
        console.error(`🎵 VoiceAnswerPlayer - ❌ Erreur chargement (tentative ${loadAttempts + 1}):`, {
          event: e,
          errorCode,
          errorMessage,
          readyState: target?.readyState,
          networkState: target?.networkState,
          src: target?.src
        });
        
        // Diagnostiquer le type d'erreur
        if (errorCode === 1) {
          console.error('🎵 VoiceAnswerPlayer - MEDIA_ERR_ABORTED: Chargement abandonné');
        } else if (errorCode === 2) {
          console.error('🎵 VoiceAnswerPlayer - MEDIA_ERR_NETWORK: Erreur réseau');
        } else if (errorCode === 3) {
          console.error('🎵 VoiceAnswerPlayer - MEDIA_ERR_DECODE: Erreur de décodage');
        } else if (errorCode === 4) {
          console.error('🎵 VoiceAnswerPlayer - MEDIA_ERR_SRC_NOT_SUPPORTED: Format non supporté');
        }
        
        if (loadAttempts < MAX_LOAD_ATTEMPTS - 1) {
          console.log('🎵 VoiceAnswerPlayer - 🔄 Tentative de rechargement dans', RETRY_DELAY, 'ms...');
          setLoadAttempts(prev => prev + 1);
          retryTimeoutRef.current = setTimeout(() => {
            if (mounted) {
              startAudioLoad();
            }
          }, RETRY_DELAY);
        } else {
          console.error("🎵 VoiceAnswerPlayer - 💥 Échec définitif après", MAX_LOAD_ATTEMPTS, "tentatives");
          setHasError(true);
          setIsLoading(false);
          
          // Toast d'erreur avec plus d'informations
          toast({
            title: "Erreur de lecture audio",
            description: `Impossible de charger l'enregistrement (code: ${errorCode}). Le fichier est peut-être corrompu ou inaccessible.`,
            variant: "destructive",
            duration: 5000
          });
        }
      };
      
      const onCanPlay = () => {
        console.log('🎵 VoiceAnswerPlayer - 🎯 Audio prêt à être lu (canplay)');
      };
      
      const onLoadStart = () => {
        console.log('🎵 VoiceAnswerPlayer - 🔄 Début du chargement audio');
      };
      
      const onProgress = () => {
        console.log('🎵 VoiceAnswerPlayer - 📊 Progression du chargement:', {
          buffered: audio.buffered.length > 0 ? audio.buffered.end(0) : 0,
          duration: audio.duration
        });
      };
      
      // Ajouter les écouteurs d'événements
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('loadstart', onLoadStart);
      audio.addEventListener('progress', onProgress);
      
      // Charger l'audio
      try {
        console.log('🎵 VoiceAnswerPlayer - 📥 Définition de la source audio:', audioUrl);
        audio.src = audioUrl;
        audio.load();
      } catch (error) {
        console.error("🎵 VoiceAnswerPlayer - 💥 Exception lors du chargement:", error);
        onError(new Event('error'));
      }
      
      // Nettoyer lors du démontage
      return () => {
        console.log('🎵 VoiceAnswerPlayer - 🧹 Nettoyage audio');
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('loadstart', onLoadStart);
        audio.removeEventListener('progress', onProgress);
        audio.pause();
        audio.src = '';
      };
    };
    
    // Démarrer le chargement immédiatement
    const cleanup = startAudioLoad();
    
    return () => {
      console.log('🎵 VoiceAnswerPlayer - 🧹 Nettoyage useEffect principal');
      mounted = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [audioUrl, loadAttempts]);
  
  const handlePlayPause = () => {
    if (!audioRef.current || hasError) {
      console.log('🎵 VoiceAnswerPlayer - handlePlayPause: pas d\'audio ou erreur');
      return;
    }
    
    try {
      if (isPlaying) {
        console.log('🎵 VoiceAnswerPlayer - ⏸️ Pause demandée');
        audioRef.current.pause();
      } else {
        console.log('🎵 VoiceAnswerPlayer - ▶️ Lecture demandée');
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("🎵 VoiceAnswerPlayer - ❌ Erreur lecture:", error);
            toast({
              title: "Erreur de lecture",
              description: "Impossible de lire l'audio. Veuillez réessayer.",
              variant: "destructive"
            });
          });
        }
      }
    } catch (error) {
      console.error("🎵 VoiceAnswerPlayer - 💥 Exception lecture/pause:", error);
    }
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || hasError) return;
    
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    try {
      audioRef.current.currentTime = newTime;
    } catch (error) {
      console.error("🎵 VoiceAnswerPlayer - ❌ Erreur modification position:", error);
    }
  };
  
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleDelete = () => {
    console.log('🎵 VoiceAnswerPlayer - 🗑️ Suppression demandée');
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onDelete();
  };
  
  const handleExport = () => {
    console.log('🎵 VoiceAnswerPlayer - 📤 Export demandé');
    handleExportAudio(audioUrl);
  };
  
  // DEBUG: Log des états de rendu
  console.log('🎵 VoiceAnswerPlayer - État rendu:', {
    isLoading,
    hasError,
    isValidUrl: validateAudioUrl(audioUrl),
    duration,
    isPlaying,
    loadAttempts,
    readOnly
  });
  
  // Si l'URL n'est pas valide, afficher un message d'erreur
  if (!validateAudioUrl(audioUrl)) {
    console.log('🎵 VoiceAnswerPlayer - Rendu: URL invalide');
    return (
      <div className="p-3 bg-red-50 text-red-800 rounded-md flex items-center mb-2">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
        <span>URL audio invalide. L'enregistrement pourrait avoir été supprimé.</span>
      </div>
    );
  }
  
  console.log('🎵 VoiceAnswerPlayer - Rendu: lecteur principal');
  
  return (
    <div>
      <div className="relative mb-2">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 z-10 rounded-md">
            <Spinner className="h-6 w-6 border-gray-500" />
            <span className="ml-2 text-sm text-gray-600">Chargement audio...</span>
          </div>
        )}
        
        {hasError ? (
          <div className="p-3 bg-amber-50 text-amber-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>Impossible de charger l'enregistrement. Vérifiez la console pour plus de détails.</span>
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
                onError={(e) => {
                  console.log("🎵 VoiceAnswerPlayer - ❌ Erreur audio natif:", e);
                }}
                onLoadedData={() => {
                  console.log("🎵 VoiceAnswerPlayer - ✅ Audio natif chargé");
                }}
                onCanPlay={() => {
                  console.log("🎵 VoiceAnswerPlayer - ✅ Audio natif prêt à jouer");
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
        
        {!readOnly && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            disabled={isPlaying || isLoading}
          >
            <Trash className="w-4 h-4 mr-1" /> Supprimer
          </Button>
        )}
      </div>
    </div>
  );
};

export default VoiceAnswerPlayer;
