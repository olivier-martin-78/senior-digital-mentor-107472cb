
import React, { useRef, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

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

  console.log("🎵 AUDIO_PLAYER_CORE - Rendering with URL:", audioUrl);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setHasError(false);
    setErrorMessage('');

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
      const errorMsg = 'Impossible de lire cet enregistrement audio';
      setHasError(true);
      setErrorMessage(errorMsg);
      onError?.(e);
    };

    const handleLoadStart = () => {
      console.log("🎵 AUDIO_PLAYER_CORE - Load start");
      setHasError(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    // Forcer le chargement
    audio.load();

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [audioUrl, onPlay, onPause, onEnded, onError]);

  // Afficher un message d'erreur au lieu de masquer complètement le composant
  if (hasError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <p className="text-xs text-red-600 mt-1">Vérifiez que le fichier audio est accessible</p>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier si l'URL semble valide
  if (!audioUrl || audioUrl.trim() === '') {
    console.log("🎵 AUDIO_PLAYER_CORE - No valid URL provided");
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}>
        <p className="text-sm text-gray-500">Aucun enregistrement audio disponible</p>
      </div>
    );
  }

  return (
    <audio
      ref={audioRef}
      src={audioUrl}
      className={`w-full ${className}`}
      controls
      preload="metadata"
    />
  );
};

export default AudioPlayerCore;
