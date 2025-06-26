
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useAudioUpload } from './AudioUploadManager';
import { useAudioState } from './AudioStateManager';

interface AudioProcessorProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated: (url: string) => void;
  reportId?: string;
}

export const useAudioProcessor = ({ onAudioRecorded, onAudioUrlGenerated, reportId }: AudioProcessorProps) => {
  const { user } = useAuth();
  const { uploadAudio } = useAudioUpload();
  const audioState = useAudioState();

  const processAudio = useCallback(async (newAudioBlob: Blob | null) => {
    console.log('🎤 handleAudioChange - Début:', { 
      hasBlob: !!newAudioBlob, 
      blobSize: newAudioBlob?.size,
      isProcessing: audioState.isProcessing,
      isUploading: audioState.isUploading
    });
    
    // Éviter les traitements concurrents
    if (!audioState.canProcess()) {
      console.log('🎤 Traitement déjà en cours, ignorer');
      return;
    }
    
    // Audio supprimé
    if (!newAudioBlob || newAudioBlob.size === 0) {
      console.log('🎤 Audio supprimé');
      audioState.clearAudio();
      audioState.setUploading(false);
      onAudioUrlGenerated('');
      return;
    }
    
    // Même blob, pas de traitement nécessaire
    if (audioState.currentBlob === newAudioBlob) {
      console.log('🎤 Même blob, pas de traitement nécessaire');
      return;
    }
    
    // Pas d'utilisateur connecté
    if (!user?.id) {
      console.log('🎤 Pas d\'utilisateur connecté');
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer un audio",
        variant: "destructive",
      });
      return;
    }
    
    try {
      audioState.startProcessing();
      audioState.setCurrentBlob(newAudioBlob);
      
      console.log('🎤 Début traitement audio:', newAudioBlob.size, 'octets');
      
      // Notifier immédiatement qu'on a un enregistrement
      onAudioRecorded(newAudioBlob);
      
      // Si on a un reportId, uploader vers Supabase
      if (reportId) {
        console.log('🎤 Upload vers Supabase pour rapport:', reportId);
        
        uploadAudio({
          audioBlob: newAudioBlob,
          userId: user.id,
          reportId,
          onUploadSuccess: (publicUrl: string) => {
            audioState.setAudioUrl(publicUrl);
            onAudioUrlGenerated(publicUrl);
          },
          onUploadError: (errorMessage: string) => {
            // Fallback : URL temporaire
            const tempUrl = URL.createObjectURL(newAudioBlob);
            audioState.setAudioUrl(tempUrl);
            onAudioUrlGenerated(tempUrl);
          },
          onUploadStart: () => audioState.setUploading(true),
          onUploadEnd: () => audioState.setUploading(false)
        });
      } else {
        // Pas de reportId : URL temporaire
        console.log('🎤 Création URL temporaire');
        const tempUrl = URL.createObjectURL(newAudioBlob);
        audioState.setAudioUrl(tempUrl);
        onAudioUrlGenerated(tempUrl);
        
        toast({
          title: "Enregistrement prêt",
          description: "Votre enregistrement sera sauvegardé avec le rapport",
        });
      }
    } catch (error) {
      if (audioState.isMounted) {
        console.error('🎤 💥 Erreur inattendue:', error);
        audioState.setUploading(false);
        
        toast({
          title: "Erreur inattendue",
          description: "Une erreur est survenue lors de l'enregistrement audio",
          variant: "destructive",
        });
      }
    } finally {
      audioState.endProcessing();
    }
  }, [user, reportId, onAudioRecorded, onAudioUrlGenerated, uploadAudio, audioState]);

  return {
    processAudio,
    audioState
  };
};
