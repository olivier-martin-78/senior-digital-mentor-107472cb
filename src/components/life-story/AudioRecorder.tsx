
import React, { useState, useEffect, useRef } from 'react';
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
  const isMounted = useRef(true);
  
  // Gestion de l'enregistrement audio
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    // Si pas de nouveau blob ou déjà en train de télécharger, ne rien faire
    if (isUploading || !newAudioBlob) {
      return;
    }
    
    setAudioBlob(newAudioBlob);
    
    if (newAudioBlob && user) {
      try {
        // Marquer comme en cours de téléchargement
        setIsUploading(true);
        
        // Lancer le téléchargement
        await uploadAudio(
          newAudioBlob,
          user.id,
          chapterId,
          questionId,
          (publicUrl) => {
            // Vérifier si le composant est toujours monté
            if (isMounted.current) {
              // Succès
              onAudioUrlChange(chapterId, questionId, publicUrl, true);
              // Réinitialiser l'état de chargement
              setIsUploading(false);
            }
          },
          (errorMessage) => {
            // Vérifier si le composant est toujours monté
            if (isMounted.current) {
              // Erreur
              console.error('Erreur d\'upload audio:', errorMessage);
              // Réinitialiser l'état de chargement
              setIsUploading(false);
            }
          },
          () => {}, // Début déjà géré par setIsUploading(true)
          () => {
            // Fin du téléchargement, vérifier si le composant est toujours monté
            if (isMounted.current) {
              setIsUploading(false);
            }
          }
        );
      } catch (error) {
        // Gérer les erreurs non attrapées
        console.error("Erreur lors du téléchargement de l'audio:", error);
        // Réinitialiser uniquement si le composant est toujours monté
        if (isMounted.current) {
          setIsUploading(false);
        }
      }
    }
  };

  // Nettoyer les états lors du démontage du composant
  useEffect(() => {
    return () => {
      // Marquer le composant comme démonté pour éviter les mises à jour d'état
      isMounted.current = false;
      setAudioBlob(null);
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
