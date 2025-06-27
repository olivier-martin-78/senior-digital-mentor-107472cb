
import React, { useRef, useEffect, useState } from 'react';
import { getAudioUrl, validateAudioUrl } from '../utils/audioUtils';
import { detectDevice, getTimeoutDuration } from './utils/deviceDetection';
import { useAudioEventHandlers } from './hooks/useAudioEventHandlers';
import IPadAudioFallback from './IPadAudioFallback';
import AudioLoadingManager from './AudioLoadingManager';
import AudioErrorMessage from './AudioErrorMessage';
import NoAudioDisplay from './NoAudioDisplay';

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
  const [showIPadFallback, setShowIPadFallback] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Traiter l'URL audio pour s'assurer qu'elle est valide et complète
  const processedAudioUrl = getAudioUrl(audioUrl);

  console.log("🎵 AUDIO_PLAYER_CORE - Rendering with URL:", audioUrl);
  console.log("🎵 AUDIO_PLAYER_CORE - Processed URL:", processedAudioUrl);

  const { isIPad, isIOS } = detectDevice();
  console.log("🎵 AUDIO_PLAYER_CORE - Device detection:", { isIPad, isIOS });

  const eventHandlers = useAudioEventHandlers({
    onPlay,
    onPause,
    onEnded,
    onError,
    setIsLoading,
    setHasError,
    setErrorMessage,
    setShowIPadFallback,
    loadingTimeoutRef,
    processedAudioUrl: processedAudioUrl || '',
    isIPad,
    isIOS
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !processedAudioUrl) return;

    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setShowIPadFallback(false);

    const timeoutDuration = getTimeoutDuration(isIPad, isIOS);
    
    // Timeout pour arrêter le loading
    loadingTimeoutRef.current = setTimeout(() => {
      console.log("🎵 AUDIO_PLAYER_CORE - Loading timeout reached, showing player");
      setIsLoading(false);
      
      // Sur iPad, si on arrive au timeout sans succès, on prépare le fallback
      if (isIPad && !audio.duration && audio.error) {
        console.log("🎵 AUDIO_PLAYER_CORE - iPad timeout with error, preparing fallback");
        setShowIPadFallback(true);
      }
    }, timeoutDuration);

    const handleErrorWrapper = (e: Event) => eventHandlers.handleError(e, audio);

    // Ajouter les listeners
    audio.addEventListener('loadstart', eventHandlers.handleLoadStart);
    audio.addEventListener('canplay', eventHandlers.handleCanPlay);
    audio.addEventListener('loadeddata', eventHandlers.handleLoadedData);
    audio.addEventListener('play', eventHandlers.handlePlay);
    audio.addEventListener('pause', eventHandlers.handlePause);
    audio.addEventListener('ended', eventHandlers.handleEnded);
    audio.addEventListener('error', handleErrorWrapper);

    // Définir l'URL et commencer le chargement
    audio.src = processedAudioUrl;
    
    // Sur iPad, utiliser une approche différente pour WebM
    if (isIPad) {
      audio.preload = 'none';
      console.log("🎵 AUDIO_PLAYER_CORE - iPad detected, using special handling");
    } else if (isIOS) {
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
      
      audio.removeEventListener('loadstart', eventHandlers.handleLoadStart);
      audio.removeEventListener('canplay', eventHandlers.handleCanPlay);
      audio.removeEventListener('loadeddata', eventHandlers.handleLoadedData);
      audio.removeEventListener('play', eventHandlers.handlePlay);
      audio.removeEventListener('pause', eventHandlers.handlePause);
      audio.removeEventListener('ended', eventHandlers.handleEnded);
      audio.removeEventListener('error', handleErrorWrapper);
      audio.pause();
      audio.src = '';
    };
  }, [processedAudioUrl, isIOS, isIPad]); // Retirer eventHandlers des dépendances

  // Vérifier si l'URL semble valide
  if (!processedAudioUrl || !validateAudioUrl(processedAudioUrl)) {
    console.log("🎵 AUDIO_PLAYER_CORE - No valid URL provided");
    return <NoAudioDisplay audioUrl={audioUrl} className={className} />;
  }

  // Fallback spécifique pour iPad avec WebM
  if (showIPadFallback && isIPad) {
    return <IPadAudioFallback audioUrl={processedAudioUrl} className={className} />;
  }

  // Afficher un message d'erreur seulement si l'erreur persiste et n'est pas sur iPad
  if (hasError && !showIPadFallback) {
    return (
      <AudioErrorMessage 
        hasError={hasError}
        errorMessage={errorMessage}
        audioUrl={processedAudioUrl}
        className={className}
      />
    );
  }

  return (
    <div className={`${className}`}>
      <AudioLoadingManager 
        isLoading={isLoading}
        isIPad={isIPad}
        isIOS={isIOS}
      />
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
