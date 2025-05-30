
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VoiceRecorder from '@/components/VoiceRecorder';
import { uploadAudio } from '@/utils/audioUploadUtils';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';

interface AudioRecorderProps {
  chapterId: string;
  questionId: string;
  onAudioUrlChange: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
}

export const AudioRecorder = ({ chapterId, questionId, onAudioUrlChange }: AudioRecorderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Utiliser des refs pour éviter les uploads multiples
  const isMounted = useRef(true);
  const currentUploadRef = useRef<string | null>(null);
  
  // Effet de nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Gestion de l'enregistrement audio
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    console.log("handleAudioChange appelé avec blob:", newAudioBlob ? `${newAudioBlob.size} octets` : "null");
    
    // Si pas de blob, audio supprimé
    if (!newAudioBlob) {
      console.log("Audio supprimé");
      setUploadedAudioUrl(null);
      onAudioUrlChange(chapterId, questionId, null);
      return;
    }
    
    // Si pas d'utilisateur, ne rien faire
    if (!user) {
      console.log("Pas d'utilisateur connecté");
      return;
    }
    
    // Vérifier si un upload est déjà en cours pour cette question
    const uploadKey = `${chapterId}-${questionId}`;
    if (isUploading || currentUploadRef.current === uploadKey) {
      console.log("Upload déjà en cours pour cette question");
      return;
    }
    
    try {
      console.log(`Début du processus d'upload pour la question ${questionId}`);
      setIsUploading(true);
      currentUploadRef.current = uploadKey;
      
      // Téléchargement de l'audio
      await uploadAudio(
        newAudioBlob,
        user.id,
        chapterId,
        questionId,
        // Callback de succès
        (publicUrl) => {
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            console.log(`Upload réussi pour la question ${questionId}, URL: ${publicUrl}`);
            setUploadedAudioUrl(publicUrl);
            onAudioUrlChange(chapterId, questionId, publicUrl, false);
            
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
          console.log(`Début du téléchargement pour la question ${questionId}`);
        },
        // Callback de fin d'upload
        () => {
          if (isMounted.current) {
            console.log(`Fin du téléchargement pour la question ${questionId}`);
            setIsUploading(false);
            currentUploadRef.current = null;
          }
        }
      );
    } catch (error) {
      if (isMounted.current) {
        console.error(`Erreur non gérée lors de l'upload audio pour la question ${questionId}:`, error);
        setIsUploading(false);
        currentUploadRef.current = null;
        
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
    <div className={`transition-all ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
      <VoiceRecorder onAudioChange={handleAudioChange} />
      
      {isUploading && (
        <div className="flex items-center justify-center py-2 mt-2 bg-gray-100 rounded-md">
          <Spinner className="h-5 w-5 border-gray-500 mr-2" />
          <span className="text-sm text-gray-700">Sauvegarde en cours...</span>
        </div>
      )}
      
      {uploadedAudioUrl && !isUploading && (
        <div className="py-2 mt-2 bg-green-100 rounded-md text-center">
          <span className="text-sm text-green-700">✓ Audio sauvegardé avec succès</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
