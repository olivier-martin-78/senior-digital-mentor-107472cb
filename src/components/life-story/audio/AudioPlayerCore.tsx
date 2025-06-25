
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
  
  // Traiter l'URL audio pour s'assurer qu'elle est valide et complète
  const processedAudioUrl = getAudioUrl(audioUrl);

  console.log("🎵 AUDIO_PLAYER_CORE - Rendering with URL:", audioUrl);
  console.log("🎵 AUDIO_PLAYER_CORE - Processed URL:", processedAudioUrl);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !processedAudioUrl) return;

    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);

    const handleLoadStart = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Load start");
      setHasError(false);
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Can play");
      setIsLoading(false);
    };

    const handleLoadedData = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Loaded data");
      setIsLoading(false);
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
      
      // Attendre un peu avant d'afficher l'erreur pour laisser le temps au navigateur
      setTimeout(() => {
        const errorMsg = 'Impossible de lire cet enregistrement audio';
        setHasError(true);
        setErrorMessage(errorMsg);
        setIsLoading(false);
        onError?.(e);
      }, 1000);
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
    audio.preload = 'metadata';

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [processedAudioUrl, onPlay, onPause, onEnded, onError]);

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
          <p className="text-sm text-gray-500">Chargement de l'audio...</p>
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
