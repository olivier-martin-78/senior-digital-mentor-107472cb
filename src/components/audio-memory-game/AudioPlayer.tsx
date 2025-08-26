import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Loader2 } from 'lucide-react';
import { useWebSpeechAPI } from '@/hooks/useWebSpeechAPI';

interface AudioPlayerProps {
  audioUrl?: string;
  ttsText?: string;
  voiceId?: string;
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
  ttsText,
  voiceId,
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
  const [audioError, setAudioError] = useState(false);
  const { speak, stop, isLoading: isSpeechLoading, isSupported } = useWebSpeechAPI();
  
  console.log('🎵 AudioPlayer render:', { audioUrl, ttsText, showControls });

  // Handle speech synthesis for TTS text
  const handleSpeech = async () => {
    if (!ttsText || !isSupported) return;
    
    try {
      await speak({
        text: ttsText,
        voiceId: voiceId || 'french',
        rate: 0.9,
        pitch: 1.0
      });
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  // Force reload when audioUrl changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    console.log('🔄 Audio URL changed, reloading:', audioUrl);
    setAudioError(false);
    audio.load();
    
    if (autoPlay) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(console.error);
      }
    }
  }, [audioUrl, autoPlay]);

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

    const handleLoadedData = () => {
      if (autoPlay) {
        setTimeout(() => {
          audio.play().catch(console.error);
        }, 100);
      }
    };

    const handleError = () => {
      console.error('🚨 Audio loading error for:', audioUrl);
      setAudioError(true);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
    };
  }, [autoPlay, onEnded, onPlay, onPause, duration]);

  const togglePlay = () => {
    console.log('🎵 togglePlay called:', { audioUrl, ttsText, isPlaying, audioError });
    
    if (audioUrl && audioRef.current && !audioError) {
      // Prioritize real audio file
      console.log('🎵 Using real audio file:', audioUrl);
      const audio = audioRef.current;

      if (isPlaying) {
        audio.pause();
      } else {
        audio.currentTime = 0;
        audio.play().catch(() => {
          console.error('🚨 Audio play failed, falling back to TTS');
          setAudioError(true);
        });
      }
    } else if (ttsText) {
      // Fallback to Web Speech API for TTS text
      console.log('🗣️ Fallback to TTS:', ttsText);
      if (isPlaying) {
        stop();
        setIsPlaying(false);
        setCurrentTime(0);
      } else {
        setIsPlaying(true);
        setCurrentTime(0);
        handleSpeech().finally(() => {
          setIsPlaying(false);
          setCurrentTime(duration);
          onEnded?.();
        });
      }
    } else {
      console.warn('⚠️ No audio source available (audioUrl or ttsText)');
    }
  };

  const formatTime = (seconds: number): string => {
    return `${Math.floor(seconds)}s`;
  };

  const effectiveAudioUrl = (audioError || !audioUrl) ? undefined : audioUrl;
  const isLoading = isSpeechLoading;
  const hasAudio = audioUrl || ttsText;
  const shouldUseTTS = audioError || !audioUrl;
  console.log('🎵 AudioPlayer state:', { hasAudio, isLoading, effectiveAudioUrl, isSupported, audioError, shouldUseTTS });

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <audio ref={audioRef} src={effectiveAudioUrl} preload="auto" />
      
      {showControls && (
        <>
          <Button
            onClick={togglePlay}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={isLoading || !hasAudio || (ttsText && !isSupported)}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isLoading ? 'Génération...' : isPlaying ? 'Pause' : 'Écouter'}
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