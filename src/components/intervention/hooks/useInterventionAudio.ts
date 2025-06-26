
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadInterventionAudio } from '@/utils/interventionAudioUtils';

export const useInterventionAudio = () => {
  const { user } = useAuth();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const handleAudioRecorded = (blob: Blob, setFormData: (fn: (prev: any) => any) => void) => {
    console.log('🎤 Audio enregistré dans useInterventionForm:', blob.size);
    setAudioBlob(blob);
    
    // Créer une URL temporaire pour la prévisualisation
    const tempUrl = URL.createObjectURL(blob);
    setFormData(prev => ({
      ...prev,
      audio_url: tempUrl
    }));
  };

  const handleAudioUrlGenerated = (url: string, setFormData: (fn: (prev: any) => any) => void) => {
    console.log('🎵 URL audio générée dans useInterventionForm:', url);
    setFormData(prev => ({
      ...prev,
      audio_url: url
    }));
  };

  const uploadAudioIfNeeded = async (savedReportId: string, audioUrl: string): Promise<string | null> => {
    if (!audioBlob || !user) {
      return audioUrl || null;
    }

    console.log('🔄 Upload de l\'audio pour le rapport:', savedReportId);
    
    return new Promise((resolve) => {
      uploadInterventionAudio(
        audioBlob,
        user.id,
        savedReportId,
        (publicUrl: string) => {
          console.log('✅ Audio uploadé avec succès:', publicUrl);
          resolve(publicUrl);
        },
        (error: string) => {
          console.error('❌ Erreur upload audio:', error);
          resolve(null);
        },
        () => setIsUploadingAudio(true),
        () => setIsUploadingAudio(false)
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
