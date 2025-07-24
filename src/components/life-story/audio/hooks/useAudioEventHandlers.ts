
import { useRef, useCallback, useMemo } from 'react';

interface UseAudioEventHandlersProps {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  setIsLoading: (loading: boolean) => void;
  setHasError: (hasError: boolean) => void;
  setErrorMessage: (message: string) => void;
  setShowIPadFallback: (show: boolean) => void;
  setShowIPhoneFallback: (show: boolean) => void;
  loadingTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  processedAudioUrl: string;
  isIPad: boolean;
  isIPhone: boolean;
  isIOS: boolean;
}

export const useAudioEventHandlers = ({
  onPlay,
  onPause,
  onEnded,
  onError,
  setIsLoading,
  setHasError,
  setErrorMessage,
  setShowIPadFallback,
  setShowIPhoneFallback,
  loadingTimeoutRef,
  processedAudioUrl,
  isIPad,
  isIPhone,
  isIOS
}: UseAudioEventHandlersProps) => {
  
  const handleLoadStart = useCallback(() => {
    console.log("🎵 AUDIO_PLAYER_CORE - Load start");
    setHasError(false);
    setIsLoading(true);
  }, [setHasError, setIsLoading]);

  const handleCanPlay = useCallback(() => {
    console.log("🎵 AUDIO_PLAYER_CORE - Can play");
    setIsLoading(false);
    setShowIPadFallback(false);
    setShowIPhoneFallback(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, [setIsLoading, setShowIPadFallback, setShowIPhoneFallback, loadingTimeoutRef]);

  const handleLoadedData = useCallback(() => {
    console.log("🎵 AUDIO_PLAYER_CORE - Loaded data");
    setIsLoading(false);
    setShowIPadFallback(false);
    setShowIPhoneFallback(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, [setIsLoading, setShowIPadFallback, setShowIPhoneFallback, loadingTimeoutRef]);

  const handlePlay = useCallback(() => {
    console.log("🎵 AUDIO_PLAYER_CORE - Playing");
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    console.log("🎵 AUDIO_PLAYER_CORE - Paused");
    onPause?.();
  }, [onPause]);

  const handleEnded = useCallback(() => {
    console.log("🎵 AUDIO_PLAYER_CORE - Ended");
    onEnded?.();
  }, [onEnded]);

  const handleError = useCallback((e: Event, audio: HTMLAudioElement) => {
    console.error("🎵 AUDIO_PLAYER_CORE - Error:", e);
    console.error("🎵 AUDIO_PLAYER_CORE - Audio error details:", {
      error: audio.error,
      networkState: audio.networkState,
      readyState: audio.readyState,
      src: audio.src
    });
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    // Sur iPad avec WebM ET erreur de format spécifique, activer le fallback
    if (isIPad && processedAudioUrl.includes('.webm') && 
        (audio.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 
         audio.error?.code === MediaError.MEDIA_ERR_DECODE)) {
      console.log("🎵 AUDIO_PLAYER_CORE - iPad WebM format error, activating fallback");
      setShowIPadFallback(true);
      setIsLoading(false);
      setHasError(false);
      return;
    }
    
    // Sur iPhone avec WebM ET erreur de format spécifique, activer le fallback  
    if (isIPhone && processedAudioUrl.includes('.webm') && 
        (audio.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 
         audio.error?.code === MediaError.MEDIA_ERR_DECODE)) {
      console.log("🎵 AUDIO_PLAYER_CORE - iPhone WebM format error, activating fallback");
      setShowIPhoneFallback(true);
      setIsLoading(false);
      setHasError(false);
      return;
    }
    
    // Pour les autres cas, attendre un peu avant d'afficher l'erreur
    const errorDelay = isIOS ? 2000 : 1000;
    setTimeout(() => {
      const errorMsg = 'Impossible de lire cet enregistrement audio';
      setHasError(true);
      setErrorMessage(errorMsg);
      setIsLoading(false);
      onError?.(e);
    }, errorDelay);
  }, [
    loadingTimeoutRef,
    isIPad,
    isIPhone,
    processedAudioUrl,
    setShowIPadFallback,
    setShowIPhoneFallback,
    setIsLoading,
    setHasError,
    isIOS,
    setErrorMessage,
    onError
  ]);

  // Mémoriser l'objet retourné pour éviter les re-renders
  return useMemo(() => ({
    handleLoadStart,
    handleCanPlay,
    handleLoadedData,
    handlePlay,
    handlePause,
    handleEnded,
    handleError
  }), [
    handleLoadStart,
    handleCanPlay,
    handleLoadedData,
    handlePlay,
    handlePause,
    handleEnded,
    handleError
  ]);
};
