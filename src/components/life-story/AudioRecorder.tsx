
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VoiceRecorder from '@/components/VoiceRecorder';
import { uploadAudio } from '@/utils/audioUploadUtils';
import { toast } from '@/hooks/use-toast';

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
  
  // Effet de nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Gestion de l'enregistrement audio
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    // Stockage du nouveau blob audio
    setAudioBlob(newAudioBlob);
    
    // Si pas de blob ou pas d'utilisateur, ne rien faire d'autre
    if (!newAudioBlob || !user || isUploading) {
      return;
    }
    
    try {
      console.log(`Début du processus d'upload pour l'audio de la question ${questionId}`);
      setIsUploading(true);
      
      // Téléchargement de l'audio
      await uploadAudio(
        newAudioBlob,
        user.id,
        chapterId,
        questionId,
        // Callback de succès
        (publicUrl) => {
          if (isMounted.current) {
            console.log(`Upload réussi pour la question ${questionId}`);
            onAudioUrlChange(chapterId, questionId, publicUrl, true);
            
            toast({
              title: "Enregistrement sauvegardé",
              description: "Votre enregistrement vocal a été sauvegardé avec succès",
              duration: 2000
            });
          }
        },
        // Callback d'erreur
        (errorMessage) => {
          if (isMounted.current) {
            console.error(`Erreur d'upload pour la question ${questionId}:`, errorMessage);
            
            toast({
              title: "Erreur",
              description: errorMessage,
              variant: "destructive",
              duration: 3000
            });
          }
        },
        // Callback de début d'upload
        () => {
          if (isMounted.current) {
            console.log(`Début du téléchargement pour la question ${questionId}`);
          }
        },
        // Callback de fin d'upload
        () => {
          if (isMounted.current) {
            console.log(`Fin du téléchargement pour la question ${questionId}`);
            setIsUploading(false);
          }
        }
      );
    } catch (error) {
      if (isMounted.current) {
        console.error(`Erreur non gérée lors de l'upload audio pour la question ${questionId}:`, error);
        setIsUploading(false);
        
        toast({
          title: "Erreur inattendue",
          description: "Une erreur est survenue lors du téléchargement de l'audio",
          variant: "destructive",
          duration: 3000
        });
      }
    }
  };

  return (
    <div className={`transition-opacity ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
      <VoiceRecorder onAudioChange={handleAudioChange} />
      {isUploading && (
        <div className="flex items-center justify-center py-2 mt-2 bg-gray-100 rounded-md">
          <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent mr-2"></div>
          <span className="text-sm text-gray-700">Téléchargement en cours...</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
