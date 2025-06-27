
import React, { useRef, useEffect, useState } from 'react';
import { AlertCircle, Download } from 'lucide-react';
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
  const [showIPadFallback, setShowIPadFallback] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Traiter l'URL audio pour s'assurer qu'elle est valide et complète
  const processedAudioUrl = getAudioUrl(audioUrl);

  console.log("🎵 AUDIO_PLAYER_CORE - Rendering with URL:", audioUrl);
  console.log("🎵 AUDIO_PLAYER_CORE - Processed URL:", processedAudioUrl);

  // Détecter spécifiquement iPad (différent d'iPhone)
  const isIPad = /iPad/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  console.log("🎵 AUDIO_PLAYER_CORE - Device detection:", { isIPad, isIOS });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !processedAudioUrl) return;

    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setShowIPadFallback(false);

    // Sur iPad, timeout plus court et gestion spéciale
    const timeoutDuration = isIPad ? 2000 : (isIOS ? 3000 : 8000);
    
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

    const handleLoadStart = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Load start");
      setHasError(false);
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Can play");
      setIsLoading(false);
      setShowIPadFallback(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };

    const handleLoadedData = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Loaded data");
      setIsLoading(false);
      setShowIPadFallback(false);
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
  }, [processedAudioUrl, onPlay, onPause, onEnded, onError, isIOS, isIPad]);

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

  // Fallback spécifique pour iPad avec WebM
  if (showIPadFallback && isIPad) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Lecture audio sur iPad
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              Le format de cet enregistrement audio n'est pas compatible avec iPad. 
              Vous pouvez télécharger le fichier pour l'écouter avec une autre application.
            </p>
            <a
              href={processedAudioUrl}
              download
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger l'enregistrement
            </a>
            <p className="text-xs text-blue-600 mt-2">
              Conseil : Utilisez l'application "Fichiers" ou "VLC" pour écouter le fichier téléchargé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Afficher un message d'erreur seulement si l'erreur persiste et n'est pas sur iPad
  if (hasError && !showIPadFallback) {
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

  return (
    <div className={`${className}`}>
      {isLoading && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">
            {isIPad ? "Vérification de la compatibilité audio..." : 
             isIOS ? "Préparation de l'audio..." : "Chargement de l'audio..."}
          </p>
          {isIPad && (
            <p className="text-xs text-gray-400 mt-1">Patientez un instant...</p>
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
