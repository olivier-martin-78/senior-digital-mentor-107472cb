
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAccessibleAudioUrl } from '@/utils/audioUploadUtils';

interface VoiceAnswerPlayerProps {
  audioUrl: string; // Maintenant c'est un chemin relatif
  onDelete: () => void;
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
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [accessibleUrl, setAccessibleUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // LOG DÉTAILLÉ pour question 1 chapitre 1
  if (shouldLog) {
    console.log('🎵 PLAYER - Question 1 Chapitre 1 - État initial:', {
      audioUrl,
      accessibleUrl,
      isLoadingUrl,
      urlError,
      timestamp: new Date().toISOString()
    });
  }

  // Générer l'URL accessible à partir du chemin
  useEffect(() => {
    const generateAccessibleUrl = async () => {
      if (!audioUrl || audioUrl.trim() === '') {
        setAccessibleUrl(null);
        return;
      }

      setIsLoadingUrl(true);
      setUrlError(null);

      try {
        if (shouldLog) {
          console.log('🎵 PLAYER - Question 1 Chapitre 1 - Génération URL pour chemin:', {
            audioUrl,
            audioUrlType: typeof audioUrl,
            audioUrlLength: audioUrl.length
          });
        }

        const url = await getAccessibleAudioUrl(audioUrl);
        
        if (url) {
          setAccessibleUrl(url);
          if (shouldLog) {
            console.log('✅ PLAYER - Question 1 Chapitre 1 - URL générée:', {
              originalPath: audioUrl,
              generatedUrl: url,
              urlLength: url.length
            });
          }
        } else {
          throw new Error('Impossible de générer l\'URL d\'accès');
        }
      } catch (error) {
        console.error('❌ PLAYER - Question 1 Chapitre 1 - Erreur génération URL:', error);
        setUrlError('Impossible de charger l\'audio');
        setAccessibleUrl(null);
      } finally {
        setIsLoadingUrl(false);
      }
    };

    generateAccessibleUrl();
  }, [audioUrl, shouldLog]);

  // Créer l'élément audio quand l'URL accessible est disponible
  useEffect(() => {
    if (accessibleUrl) {
      if (shouldLog) {
        console.log('🎵 PLAYER - Question 1 Chapitre 1 - Création élément audio avec URL:', accessibleUrl);
      }
      
      const audio = new Audio(accessibleUrl);
      
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => {
        setDuration(audio.duration);
        if (shouldLog) {
          console.log('🎵 PLAYER - Question 1 Chapitre 1 - Durée audio chargée:', audio.duration);
        }
      };
      const handleEnded = () => {
        setIsPlaying(false);
        if (shouldLog) {
          console.log('🎵 PLAYER - Question 1 Chapitre 1 - Lecture terminée');
        }
      };
      const handleError = (e: any) => {
        console.error('❌ PLAYER - Question 1 Chapitre 1 - Erreur audio:', e);
        setUrlError('Erreur de lecture audio');
        setIsPlaying(false);
      };

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      setAudioElement(audio);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.pause();
        setAudioElement(null);
        if (shouldLog) {
          console.log('🎵 PLAYER - Question 1 Chapitre 1 - Nettoyage élément audio');
        }
      };
    } else {
      setAudioElement(null);
    }
  }, [accessibleUrl, shouldLog]);

  const togglePlayPause = async () => {
    if (!audioElement) {
      if (shouldLog) {
        console.log('❌ PLAYER - Question 1 Chapitre 1 - Pas d\'élément audio disponible');
      }
      return;
    }

    try {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
        if (shouldLog) {
          console.log('⏸️ PLAYER - Question 1 Chapitre 1 - Audio mis en pause');
        }
      } else {
        await audioElement.play();
        setIsPlaying(true);
        if (shouldLog) {
          console.log('▶️ PLAYER - Question 1 Chapitre 1 - Audio en lecture');
        }
      }
    } catch (error) {
      console.error('❌ PLAYER - Question 1 Chapitre 1 - Erreur de lecture audio:', error);
      setUrlError('Impossible de lire l\'audio');
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire l'enregistrement audio",
        variant: "destructive",
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioElement) {
      const newTime = parseFloat(e.target.value);
      audioElement.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleDownload = async () => {
    if (!accessibleUrl) {
      toast({
        title: "Erreur de téléchargement",
        description: "URL audio non disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(accessibleUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `enregistrement_vocal_${new Date().toISOString().slice(0,10)}.webm`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Téléchargement réussi",
        description: "L'enregistrement audio a été téléchargé",
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger l'enregistrement audio",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (shouldLog) {
      console.log('🗑️ PLAYER - Question 1 Chapitre 1 - Suppression audio demandée');
    }
    
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
    onDelete();
  };

  const handleRefreshUrl = () => {
    if (shouldLog) {
      console.log('🔄 PLAYER - Question 1 Chapitre 1 - Rafraîchissement URL demandé');
    }
    // Forcer la régénération de l'URL
    setAccessibleUrl(null);
    setUrlError(null);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (shouldLog) {
    console.log('🎵 PLAYER - Question 1 Chapitre 1 - État du rendu:', {
      audioUrl,
      accessibleUrl: !!accessibleUrl,
      isLoadingUrl,
      urlError,
      hasAudioElement: !!audioElement,
      isPlaying,
      readOnly,
      timestamp: new Date().toISOString()
    });
  }

  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      <div className="text-sm font-medium mb-3 text-gray-700">Enregistrement vocal</div>
      
      {isLoadingUrl ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
          <span className="ml-2 text-sm text-gray-600">Chargement de l'audio...</span>
        </div>
      ) : urlError ? (
        <div className="text-center py-4">
          <p className="text-red-600 text-sm mb-2">{urlError}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshUrl}
            className="text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Réessayer
          </Button>
        </div>
      ) : accessibleUrl && audioElement ? (
        <>
          <div className="flex items-center space-x-3 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPause}
              className="flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex space-x-2">
            {!readOnly && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-1" />
              Télécharger
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">Aucun enregistrement disponible</p>
        </div>
      )}
    </div>
  );
};

export default VoiceAnswerPlayer;
