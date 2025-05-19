
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { deleteAudio } from '@/utils/audioUploadUtils';
import { Spinner } from '@/components/ui/spinner';
import { validateAudioUrl, preloadAudio } from './utils/audioUtils';

interface AudioPlayerProps {
  audioUrl: string;
  chapterId: string;
  questionId: string;
  onDeleteSuccess: () => void;
}

export const AudioPlayer = ({ audioUrl, chapterId, questionId, onDeleteSuccess }: AudioPlayerProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Vérifier si l'URL est valide
  useEffect(() => {
    const isValid = validateAudioUrl(audioUrl) !== null;
    setIsValidUrl(isValid);
    
    if (!isValid) {
      setAudioError(true);
      setAudioLoaded(false);
    } else {
      // Précharger l'audio pour vérifier sa disponibilité
      const checkAudio = async () => {
        try {
          const isValidAudio = await preloadAudio(audioUrl);
          setAudioError(!isValidAudio);
        } catch (error) {
          console.error("Erreur lors du préchargement de l'audio:", error);
          setAudioError(true);
        } finally {
          setIsRetrying(false);
        }
      };
      
      checkAudio();
    }
  }, [audioUrl, isRetrying]);
  
  const handleDeleteAudio = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      console.log(`Début de la suppression de l'audio pour la question ${questionId}`);
      
      await deleteAudio(
        audioUrl,
        () => {
          onDeleteSuccess();
          toast({
            title: 'Audio supprimé',
            description: 'L\'enregistrement audio a été supprimé avec succès.',
            duration: 2000
          });
        },
        (errorMessage) => {
          toast({
            title: 'Erreur',
            description: errorMessage,
            variant: 'destructive',
            duration: 3000
          });
          setIsDeleting(false);
        }
      );
    } catch (error) {
      console.error('Erreur non gérée lors de la suppression:', error);
      toast({
        title: 'Erreur inattendue',
        description: 'Une erreur s\'est produite lors de la suppression de l\'audio.',
        variant: 'destructive',
        duration: 3000
      });
      setIsDeleting(false);
    }
  };
  
  const handleAudioError = () => {
    console.error(`Erreur de chargement audio pour l'URL: ${audioUrl}`);
    setAudioError(true);
    setAudioLoaded(false);
  };

  const handleAudioLoad = () => {
    console.log(`Audio chargé avec succès: ${audioUrl}`);
    setAudioLoaded(true);
    setAudioError(false);
  };
  
  const handlePlayStateChange = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setIsPlaying(!e.currentTarget.paused);
  };
  
  const handleRetryLoad = () => {
    setIsRetrying(true);
    setAudioError(false);
    setAudioLoaded(false);
  };

  if (!isValidUrl) {
    return (
      <div className="mt-2 p-3 border rounded-md bg-red-50 text-red-800">
        <div className="text-sm font-medium mb-2">Enregistrement audio indisponible</div>
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>L'URL de l'enregistrement audio est invalide.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDeleteAudio}
          className="mt-2 bg-white text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash className="w-4 h-4 mr-1" /> Supprimer cette référence
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 border rounded-md bg-gray-50">
      <div className="text-sm font-medium mb-2">Enregistrement audio existant</div>
      
      {audioError ? (
        <div className="p-3 mb-3 bg-amber-50 text-amber-700 rounded-md">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="font-medium">Impossible de charger l'audio</span>
          </div>
          <p className="text-sm mb-2">Le fichier audio est peut-être inaccessible ou a été supprimé.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryLoad}
            className="bg-white"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRetrying ? 'animate-spin' : ''}`} /> 
            {isRetrying ? 'Tentative...' : 'Réessayer'}
          </Button>
        </div>
      ) : (
        <div className="relative">
          {!audioLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 z-10 rounded">
              <Spinner className="h-6 w-6 border-gray-500" />
            </div>
          )}
          <audio 
            src={audioUrl} 
            controls 
            className={`w-full mb-3 ${!audioLoaded ? 'opacity-0' : ''}`}
            onError={handleAudioError}
            onLoadedData={handleAudioLoad}
            onPlay={handlePlayStateChange}
            onPause={handlePlayStateChange}
          />
        </div>
      )}
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDeleteAudio}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          disabled={isDeleting || isPlaying}
        >
          {isDeleting ? (
            <>
              <Spinner className="w-3 h-3 mr-2 border-current border-t-transparent" />
              Suppression...
            </>
          ) : (
            <>
              <Trash className="w-4 h-4 mr-1" /> Supprimer l'audio
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AudioPlayer;
