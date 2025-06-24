
import React, { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { validateAudioUrl, handleExportAudio, getAudioUrl } from '../utils/audioUtils';
import AudioControls from './AudioControls';
import AudioProgressBar from './AudioProgressBar';
import AudioErrorDisplay from './AudioErrorDisplay';

interface AudioPlayerCoreProps {
  audioUrl: string;
  onDelete?: () => void;
  readOnly?: boolean;
  shouldLog?: boolean;
}

const AudioPlayerCore: React.FC<AudioPlayerCoreProps> = ({
  audioUrl,
  onDelete,
  readOnly = false,
  shouldLog = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Convertir le chemin en URL complète
  const fullAudioUrl = getAudioUrl(audioUrl);

  if (shouldLog) {
    console.log('🎵 PLAYER - État du lecteur:', {
      originalAudioUrl: audioUrl,
      fullAudioUrl,
      hasAudioUrl: !!audioUrl,
      hasFullAudioUrl: !!fullAudioUrl,
      audioUrlType: typeof audioUrl,
      isPlaying,
      duration,
      readOnly,
      hasError,
      isLoading,
      isBlobUrl: audioUrl.startsWith('blob:')
    });
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (shouldLog) {
        console.log('🎵 PLAYER - Audio metadata loaded:', { duration: audio.duration });
      }
      setDuration(audio.duration);
      setIsLoading(false);
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (error: any) => {
      console.error('🎵 PLAYER - Erreur audio:', error);
      setHasError(true);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl, shouldLog]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Erreur lecture:', error);
        setHasError(true);
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire l'enregistrement audio. Le fichier pourrait être endommagé ou indisponible.",
          variant: "destructive",
        });
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDelete = () => {
    if (readOnly || !onDelete) return;
    
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
    
    onDelete();
    
    toast({
      title: "Enregistrement supprimé",
      description: "L'enregistrement vocal a été supprimé avec succès",
    });
  };

  const handleExport = () => {
    try {
      // Utiliser l'URL complète pour l'export
      handleExportAudio(fullAudioUrl || audioUrl);
      toast({
        title: "Export réussi",
        description: "L'enregistrement audio a été téléchargé",
      });
    } catch (error) {
      console.error('Erreur export:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter l'enregistrement",
        variant: "destructive",
      });
    }
  };

  // Utiliser fullAudioUrl pour la validation
  if (!fullAudioUrl) {
    if (shouldLog) {
      console.log('🎵 PLAYER - URL audio invalide après conversion:', {
        originalUrl: audioUrl,
        convertedUrl: fullAudioUrl
      });
    }
    return null;
  }

  // Vérifier si c'est une URL blob expirée
  const isBlobUrl = audioUrl.startsWith('blob:');
  const showBlobWarning = isBlobUrl && hasError;

  return (
    <>
      <audio
        ref={audioRef}
        src={fullAudioUrl}
        preload="metadata"
        style={{ display: 'none' }}
      />
      
      <AudioErrorDisplay
        showBlobWarning={showBlobWarning}
        hasError={hasError}
        fullAudioUrl={fullAudioUrl}
        readOnly={readOnly}
        shouldLog={shouldLog}
        onDelete={handleDelete}
      />

      {!showBlobWarning && !hasError && (
        <>
          <AudioControls
            isPlaying={isPlaying}
            isLoading={isLoading}
            currentTime={currentTime}
            duration={duration}
            readOnly={readOnly}
            isBlobUrl={isBlobUrl}
            onPlayPause={togglePlayPause}
            onExport={handleExport}
            onDelete={handleDelete}
          />
          
          <AudioProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
          />
        </>
      )}
    </>
  );
};

export default AudioPlayerCore;
