
import React from 'react';
import { uploadInterventionAudio } from '@/utils/interventionAudioUtils';
import { toast } from '@/hooks/use-toast';

interface AudioUploadManagerProps {
  audioBlob: Blob;
  userId: string;
  reportId: string;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
}

export const useAudioUpload = () => {
  const uploadAudio = (props: AudioUploadManagerProps) => {
    const {
      audioBlob,
      userId,
      reportId,
      onUploadSuccess,
      onUploadError,
      onUploadStart,
      onUploadEnd
    } = props;

    uploadInterventionAudio(
      audioBlob,
      userId,
      reportId,
      // Success callback
      (publicUrl: string) => {
        console.log('🎤 ✅ Upload réussi:', publicUrl);
        onUploadSuccess(publicUrl);
        
        toast({
          title: "Enregistrement sauvegardé",
          description: "Votre enregistrement vocal a été sauvegardé avec succès",
        });
      },
      // Error callback
      (errorMessage: string) => {
        console.error('🎤 ❌ Erreur upload:', errorMessage);
        onUploadError(errorMessage);
        
        // Fallback message
        toast({
          title: "Enregistrement temporaire",
          description: "L'enregistrement est sauvé localement. Sauvegardez le rapport pour le conserver.",
          variant: "default",
        });
      },
      // Start callback
      () => {
        console.log('🎤 📤 Début upload');
        onUploadStart();
      },
      // End callback
      () => {
        console.log('🎤 📥 Fin upload');
        onUploadEnd();
      }
    );
  };

  return { uploadAudio };
};
