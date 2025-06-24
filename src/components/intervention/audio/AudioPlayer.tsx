
import React, { useRef, useEffect, useState } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onError: (e: any) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  onPlay,
  onPause,
  onEnded,
  onError
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  console.log("🎵 AUDIO_PLAYER - Rendering with URL:", audioUrl);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log("🎵 AUDIO_PLAYER - Metadata loaded, duration:", audio.duration);
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      console.log("🎵 AUDIO_PLAYER - Playing");
      setIsPlaying(true);
      onPlay();
    };

    const handlePause = () => {
      console.log("🎵 AUDIO_PLAYER - Paused");
      setIsPlaying(false);
      onPause();
    };

    const handleEnded = () => {
      console.log("🎵 AUDIO_PLAYER - Ended");
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded();
    };

    const handleError = (e: Event) => {
      console.error("🎵 AUDIO_PLAYER - Error:", e);
      setIsPlaying(false);
      onError(e);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Forcer le chargement des métadonnées
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, onPlay, onPause, onEnded, onError]);

  // Fonction pour contrôler la lecture depuis l'extérieur
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Exposer les contrôles audio sur l'élément pour permettre le contrôle externe
    (audio as any).playAudio = () => {
      console.log("🎵 AUDIO_PLAYER - External play command");
      return audio.play();
    };

    (audio as any).pauseAudio = () => {
      console.log("🎵 AUDIO_PLAYER - External pause command");
      audio.pause();
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-player-container">
      <audio
        ref={audioRef}
        src={audioUrl}
        className="hidden"
        preload="metadata"
      />
      
      {/* Affichage de la progression */}
      {duration > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <div className="flex-1 bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
