
import { useRef, useCallback } from 'react';

interface UseAudioEventHandlersProps {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  setIsLoading: (loading: boolean) => void;
  setHasError: (hasError: boolean) => void;
  setErrorMessage: (message: string) => void;
  setShowIPadFallback: (show: boolean) => void;
  loadingTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  processedAudioUrl: string;
  isIPad: boolean;
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
  loadingTimeoutRef,
  processedAudioUrl,
  isIPad,
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
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, [setIsLoading, setShowIPadFallback, loadingTimeoutRef]);

  const handleLoadedData = useCallback(() => {
    console.log("🎵 AUDIO_PLAYER_CORE - Loaded data");
    setIsLoading(false);
    setShowIPadFallback(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, [setIsLoading, setShowIPadFallback, loadingTimeoutRef]);

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
    
    // Sur iPad avec WebM, activer immédiatement le fallback
    if (isIPad && processedAudioUrl.includes('.webm')) {
      console.log("🎵 AUDIO_PLAYER_CORE - iPad WebM error, activating fallback");
      setShowIPadFallback(true);
      setIsLoading(false);
      setHasError(false); // Ne pas afficher l'erreur générique
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
    processedAudioUrl,
    setShowIPadFallback,
    setIsLoading,
    setHasError,
    isIOS,
    setErrorMessage,
    onError
  ]);

  return {
    handleLoadStart,
    handleCanPlay,
    handleLoadedData,
    handlePlay,
    handlePause,
    handleEnded,
    handleError
  };
};
