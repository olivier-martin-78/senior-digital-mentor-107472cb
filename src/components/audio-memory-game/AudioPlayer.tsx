import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
  showControls?: boolean;
  duration?: number; // Durée fixe en secondes
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  autoPlay = false,
  onEnded,
  onPlay,
  onPause,
  className = "",
  showControls = true,
  duration = 2
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Arrêter après la durée spécifiée
      if (duration && audio.currentTime >= duration) {
        audio.pause();
        audio.currentTime = 0;
        handleEnded();
      }
    };

    const handleLoadedMetadata = () => {
      if (autoPlay) {
        audio.play().catch(console.error);
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [autoPlay, onEnded, onPlay, onPause, duration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.currentTime = 0; // Toujours recommencer depuis le début
      audio.play().catch(console.error);
    }
  };

  const formatTime = (seconds: number): string => {
    return `${Math.floor(seconds)}s`;
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {showControls && (
        <>
          <Button
            onClick={togglePlay}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isPlaying ? 'Pause' : 'Écouter'}
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Volume2 className="w-4 h-4" />
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          {/* Barre de progression */}
          <div className="flex-1 bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-200"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
};