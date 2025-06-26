
import React, { useRef, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { getAudioUrl, validateAudioUrl } from '../utils/audioUtils';

interface AudioPlayerCoreProps {
  audioUrl: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  className?: string;
}

const AudioPlayerCore: React.FC<AudioPlayerCoreProps> = ({
  audioUrl,
  onPlay,
  onPause,
  onEnded,
  onError,
  className = ""
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Traiter l'URL audio pour s'assurer qu'elle est valide et complète
  const processedAudioUrl = getAudioUrl(audioUrl);

  console.log("🎵 AUDIO_PLAYER_CORE - Rendering with URL:", audioUrl);
  console.log("🎵 AUDIO_PLAYER_CORE - Processed URL:", processedAudioUrl);

  // Détecter iOS/iPadOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !processedAudioUrl) return;

    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);

    // Sur iOS, timeout plus court car les événements peuvent ne jamais se déclencher
    const timeoutDuration = isIOS ? 3000 : 8000;
    
    // Timeout pour arrêter le loading sur iOS
    loadingTimeoutRef.current = setTimeout(() => {
      console.log("🎵 AUDIO_PLAYER_CORE - Loading timeout reached, showing player");
      setIsLoading(false);
      
      // Sur iOS, forcer un rechargement léger pour éliminer la spinning wheel
      if (isIOS && audio) {
        const currentTime = audio.currentTime;
        audio.load(); // Recharge l'élément audio
        audio.currentTime = currentTime; // Restaure la position
      }
    }, timeoutDuration);

    const handleLoadStart = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Load start");
      setHasError(false);
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Can play");
      setIsLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };

    const handleLoadedData = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Loaded data");
      setIsLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };

    const handlePlay = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Playing");
      onPlay?.();
    };

    const handlePause = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Paused");
      onPause?.();
    };

    const handleEnded = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Ended");
      onEnded?.();
    };

    const handleError = (e: Event) => {
      console.error("🎵 AUDIO_PLAYER_CORE - Error:", e);
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      // Sur iOS, attendre un peu avant d'afficher l'erreur car l'audio peut marcher malgré l'erreur
      const errorDelay = isIOS ? 2000 : 1000;
      setTimeout(() => {
        const errorMsg = 'Impossible de lire cet enregistrement audio';
        setHasError(true);
        setErrorMessage(errorMsg);
        setIsLoading(false);
        onError?.(e);
      }, errorDelay);
    };

    // Ajouter les listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Définir l'URL et commencer le chargement
    audio.src = processedAudioUrl;
    
    // Sur iOS, utiliser preload='auto' après le timeout pour forcer le rechargement
    if (isIOS) {
      audio.preload = 'none';
      // Après un délai, passer en preload auto pour éliminer la spinning wheel
      setTimeout(() => {
        if (audio && !audio.error) {
          audio.preload = 'auto';
        }
      }, timeoutDuration + 500);
    } else {
      audio.preload = 'metadata';
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [processedAudioUrl, onPlay, onPause, onEnded, onError, isIOS]);

  // Afficher un message d'erreur seulement si l'erreur persiste
  if (hasError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <p className="text-xs text-red-600 mt-1">Vérifiez que le fichier audio est accessible</p>
            <p className="text-xs text-gray-500 mt-1">URL: {processedAudioUrl}</p>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier si l'URL semble valide
  if (!processedAudioUrl || !validateAudioUrl(processedAudioUrl)) {
    console.log("🎵 AUDIO_PLAYER_CORE - No valid URL provided");
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}>
        <p className="text-sm text-gray-500">Aucun enregistrement audio disponible</p>
        {audioUrl && (
          <p className="text-xs text-gray-400 mt-1">URL originale: {audioUrl}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {isLoading && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">
            {isIOS ? "Préparation de l'audio..." : "Chargement de l'audio..."}
          </p>
          {isIOS && (
            <p className="text-xs text-gray-400 mt-1">L'audio sera disponible dans un instant</p>
          )}
        </div>
      )}
      <audio
        ref={audioRef}
        className="w-full"
        controls
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default AudioPlayerCore;
