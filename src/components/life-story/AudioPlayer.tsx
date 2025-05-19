
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { deleteAudio } from '@/utils/audioUploadUtils';

interface AudioPlayerProps {
  audioUrl: string;
  chapterId: string;
  questionId: string;
  onDeleteSuccess: () => void;
}

export const AudioPlayer = ({ audioUrl, chapterId, questionId, onDeleteSuccess }: AudioPlayerProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDeleteAudio = async () => {
    try {
      setIsDeleting(true);
      
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
            duration: 2000
          });
        }
      );
    } catch (error) {
      console.error('Erreur non gérée lors de la suppression:', error);
      toast({
        title: 'Erreur inattendue',
        description: 'Une erreur s\'est produite lors de la suppression de l\'audio.',
        variant: 'destructive',
        duration: 2000
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-2 p-3 border rounded-md bg-gray-50">
      <div className="text-sm font-medium mb-2">Enregistrement audio existant</div>
      <audio src={audioUrl} controls className="w-full mb-2" />
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDeleteAudio}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <div className="w-3 h-3 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
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
