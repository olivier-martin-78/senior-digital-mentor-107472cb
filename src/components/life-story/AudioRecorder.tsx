
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import VoiceRecorder from '@/components/VoiceRecorder';
import { uploadAudio } from '@/utils/audioUploadUtils';

interface AudioRecorderProps {
  chapterId: string;
  questionId: string;
  onAudioUrlChange: (chapterId: string, questionId: string, audioUrl: string | null) => void;
}

export const AudioRecorder = ({ chapterId, questionId, onAudioUrlChange }: AudioRecorderProps) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  const { user } = useAuth();

  // Gérer l'affichage du toast uniquement après un téléchargement réussi
  useEffect(() => {
    if (uploadSuccess && !toastShown) {
      setToastShown(true);
      toast({
        title: 'Audio enregistré',
        description: 'Votre enregistrement audio a été sauvegardé avec succès.',
      });
    }
  }, [uploadSuccess, toastShown]);

  // Nettoyer les états lors du démontage
  useEffect(() => {
    return () => {
      setAudioBlob(null);
      setIsUploading(false);
      setUploadSuccess(false);
      setToastShown(false);
    };
  }, []);

  // Détecter quand un nouvel enregistrement audio est créé
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    // Ne rien faire si c'est le même blob ou si nous sommes déjà en train de télécharger
    if (isUploading) return;
    
    setAudioBlob(newAudioBlob);
    
    if (newAudioBlob && user) {
      await uploadAudio(
        newAudioBlob,
        user.id,
        chapterId,
        questionId,
        (publicUrl) => {
          // Succès
          onAudioUrlChange(chapterId, questionId, publicUrl);
          setUploadSuccess(true);
        },
        (errorMessage) => {
          // Erreur
          toast({
            title: 'Erreur',
            description: errorMessage,
            variant: 'destructive',
          });
        },
        () => {
          // Début du téléchargement
          setIsUploading(true);
          setUploadSuccess(false);
          setToastShown(false);
        },
        () => {
          // Fin du téléchargement
          setIsUploading(false);
        }
      );
    }
  };

  return (
    <div className={isUploading ? "opacity-50 pointer-events-none" : ""}>
      <VoiceRecorder onAudioChange={handleAudioChange} />
      {isUploading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent mr-2"></div>
          <span className="text-sm text-gray-500">Téléchargement en cours...</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
