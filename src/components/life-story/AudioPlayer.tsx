
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { deleteAudio } from '@/utils/audioUploadUtils';
import { Spinner } from '@/components/ui/spinner';

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

  return (
    <div className="mt-2 p-3 border rounded-md bg-gray-50">
      <div className="text-sm font-medium mb-2">Enregistrement audio existant</div>
      
      {audioError ? (
        <div className="p-2 mb-2 bg-amber-50 text-amber-700 text-sm border border-amber-200 rounded flex items-center">
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>Impossible de charger l'audio. Le fichier a peut-être été supprimé ou déplacé.</span>
        </div>
      ) : (
        <div className="relative">
          {!audioLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 z-10">
              <Spinner className="h-6 w-6 border-gray-500" />
            </div>
          )}
          <audio 
            src={audioUrl} 
            controls 
            className={`w-full mb-2 ${!audioLoaded ? 'opacity-0' : ''}`}
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
