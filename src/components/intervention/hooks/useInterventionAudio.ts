
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadInterventionAudio } from '@/utils/interventionAudioUtils';
import { toast } from '@/hooks/use-toast';

export const useInterventionAudio = () => {
  const { user } = useAuth();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const handleAudioRecorded = (blob: Blob, setFormData: (fn: (prev: any) => any) => void) => {
    console.log('🎤 AUDIO_HOOK - Audio enregistré:', blob.size, 'octets');
    setAudioBlob(blob);
    
    // Créer une URL temporaire pour la prévisualisation
    const tempUrl = URL.createObjectURL(blob);
    setFormData(prev => ({
      ...prev,
      audio_url: tempUrl
    }));
  };

  const handleAudioUrlGenerated = (url: string, setFormData: (fn: (prev: any) => any) => void) => {
    console.log('🎵 AUDIO_HOOK - URL audio générée:', url);
    setFormData(prev => ({
      ...prev,
      audio_url: url
    }));
  };

  const uploadAudioIfNeeded = async (savedReportId: string, audioUrl: string): Promise<string | null> => {
    console.log('🔄 AUDIO_HOOK - uploadAudioIfNeeded appelé:', {
      hasBlob: !!audioBlob,
      blobSize: audioBlob?.size,
      hasUser: !!user,
      savedReportId,
      currentAudioUrl: audioUrl
    });

    if (!audioBlob || !user) {
      console.log('⚠️ AUDIO_HOOK - Pas de blob ou utilisateur:', { hasBlob: !!audioBlob, hasUser: !!user });
      return audioUrl || null;
    }

    console.log('🔄 AUDIO_HOOK - Début upload de l\'audio pour le rapport:', savedReportId);
    
    return new Promise((resolve) => {
      uploadInterventionAudio(
        audioBlob,
        user.id,
        savedReportId,
        // Callback de succès
        (publicUrl: string) => {
          console.log('✅ AUDIO_HOOK - Audio uploadé avec succès:', publicUrl);
          toast({
            title: "Audio sauvegardé",
            description: "L'enregistrement vocal a été sauvegardé avec succès",
            duration: 2000
          });
          resolve(publicUrl);
        },
        // Callback d'erreur
        (error: string) => {
          console.error('❌ AUDIO_HOOK - Erreur upload audio:', error);
          toast({
            title: "Erreur de sauvegarde audio",
            description: error,
            variant: "destructive",
            duration: 5000
          });
          resolve(null);
        },
        // Callback de début d'upload
        () => {
          console.log('📤 AUDIO_HOOK - Début upload');
          setIsUploadingAudio(true);
        },
        // Callback de fin d'upload
        () => {
          console.log('📥 AUDIO_HOOK - Fin upload');
          setIsUploadingAudio(false);
        }
      );
    });
  };

  return {
    audioBlob,
    isUploadingAudio,
    handleAudioRecorded,
    handleAudioUrlGenerated,
    uploadAudioIfNeeded,
  };
};
