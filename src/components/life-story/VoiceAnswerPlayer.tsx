
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { validateAudioUrl, handleExportAudio, formatTime, getAudioUrl } from './utils/audioUtils';

interface VoiceAnswerPlayerProps {
  audioUrl: string;
  onDelete?: () => void;
  readOnly?: boolean;
  shouldLog?: boolean;
}

const VoiceAnswerPlayer: React.FC<VoiceAnswerPlayerProps> = ({
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
    <div className="border rounded-md p-4 bg-gray-50">
      <div className="text-sm font-medium mb-3">Enregistrement vocal</div>
      
      <audio
        ref={audioRef}
        src={fullAudioUrl}
        preload="metadata"
        style={{ display: 'none' }}
      />
      
      {showBlobWarning ? (
        <div className="text-center py-4">
          <p className="text-red-500 text-sm mb-2">Enregistrement temporaire expiré</p>
          <p className="text-xs text-gray-500">L'enregistrement était temporaire et n'est plus disponible. Veuillez créer un nouvel enregistrement.</p>
          {!readOnly && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="mt-2 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          )}
        </div>
      ) : hasError ? (
        <div className="text-center py-4">
          <p className="text-red-500 text-sm">Impossible de charger l'enregistrement</p>
          {shouldLog && (
            <p className="text-xs text-gray-500 mt-1">URL: {fullAudioUrl}</p>
          )}
        </div>
      ) : (
        <>
          {/* Contrôles de lecture */}
          <div className="flex items-center space-x-3 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <div className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          {/* Barre de progression */}
          {duration > 0 && (
            <div className="mb-3">
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
          )}
          
          {/* Boutons d'action */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              disabled={isBlobUrl}
            >
              <Download className="w-4 h-4 mr-1" />
              Exporter
            </Button>
            
            {!readOnly && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceAnswerPlayer;
