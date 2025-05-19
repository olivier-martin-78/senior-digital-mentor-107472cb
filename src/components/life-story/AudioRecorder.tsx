
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VoiceRecorder from '@/components/VoiceRecorder';
import { uploadAudio } from '@/utils/audioUploadUtils';

interface AudioRecorderProps {
  chapterId: string;
  questionId: string;
  onAudioUrlChange: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
}

export const AudioRecorder = ({ chapterId, questionId, onAudioUrlChange }: AudioRecorderProps) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  
  // Gestion de l'enregistrement audio
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    // Si pas de nouveau blob ou déjà en train de télécharger, ne rien faire
    if (isUploading || !newAudioBlob) {
      return;
    }
    
    setAudioBlob(newAudioBlob);
    
    if (newAudioBlob && user) {
      try {
        setIsUploading(true);
        
        await uploadAudio(
          newAudioBlob,
          user.id,
          chapterId,
          questionId,
          (publicUrl) => {
            // Succès
            onAudioUrlChange(chapterId, questionId, publicUrl, true);
          },
          (errorMessage) => {
            // Erreur
            console.error('Erreur d\'upload audio:', errorMessage);
          },
          () => {}, // Début du téléchargement (déjà géré par setIsUploading)
          () => {} // Fin du téléchargement (géré plus bas)
        );
      } catch (error) {
        console.error("Erreur lors du téléchargement de l'audio:", error);
      } finally {
        // S'assurer que l'état de chargement est réinitialisé dans tous les cas
        setIsUploading(false);
      }
    }
  };

  // Nettoyer les états lors du démontage du composant
  useEffect(() => {
    return () => {
      setAudioBlob(null);
      setIsUploading(false);
    };
  }, []);

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
