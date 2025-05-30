
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
    console.log("AudioRecorder - handleAudioChange appelé:", { 
      hasBlob: !!newAudioBlob, 
      blobSize: newAudioBlob?.size,
      questionId,
      isUploading
    });
    
    // Si pas de blob, audio supprimé
    if (!newAudioBlob || newAudioBlob.size === 0) {
      console.log("AudioRecorder - Audio supprimé ou vide");
      setUploadedAudioUrl(null);
      setIsUploading(false);
      currentUploadRef.current = null;
      onAudioUrlChange(chapterId, questionId, null);
      return;
    }
    
    // Si pas d'utilisateur, ne rien faire
    if (!user?.id) {
      console.log("AudioRecorder - Pas d'utilisateur connecté");
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer un audio",
        variant: "destructive",
      });
      return;
    }
    
    // Vérifier si un upload est déjà en cours pour cette question
    const uploadKey = `${chapterId}-${questionId}`;
    if (isUploading || currentUploadRef.current === uploadKey) {
      console.log("AudioRecorder - Upload déjà en cours pour cette question");
      return;
    }
    
    try {
      console.log(`AudioRecorder - Début du processus d'upload pour la question ${questionId}`);
      setIsUploading(true);
      currentUploadRef.current = uploadKey;
      
      // Tentative de téléchargement de l'audio
      await uploadAudio(
        newAudioBlob,
        user.id,
        chapterId,
        questionId,
        // Callback de succès
        (publicUrl) => {
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            console.log(`AudioRecorder - Upload réussi pour la question ${questionId}, URL: ${publicUrl}`);
            setUploadedAudioUrl(publicUrl);
            setIsUploading(false);
            currentUploadRef.current = null;
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
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            console.error(`AudioRecorder - Erreur d'upload pour la question ${questionId}:`, errorMessage);
            setIsUploading(false);
            currentUploadRef.current = null;
            
            // Si c'est une erreur de bucket, proposer de continuer sans sauvegarde cloud
            if (errorMessage.includes('Bucket not found') || errorMessage.includes('bucket')) {
              console.log('AudioRecorder - Bucket audio non trouvé, sauvegarde locale uniquement');
              toast({
                title: "Stockage audio indisponible",
                description: "L'enregistrement est conservé localement mais ne sera pas sauvegardé sur le serveur",
                variant: "destructive",
                duration: 4000
              });
              
              setUploadedAudioUrl('local-audio');
              onAudioUrlChange(chapterId, questionId, null, true);
            } else {
              toast({
                title: "Erreur de sauvegarde",
                description: errorMessage,
                variant: "destructive",
                duration: 3000
              });
            }
          }
        },
        // Callback de début d'upload
        () => {
          console.log(`AudioRecorder - Début du téléchargement pour la question ${questionId}`);
        },
        // Callback de fin d'upload
        () => {
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            console.log(`AudioRecorder - Fin du téléchargement pour la question ${questionId}`);
            setIsUploading(false);
            currentUploadRef.current = null;
          }
        }
      );
    } catch (error) {
      if (isMounted.current && currentUploadRef.current === uploadKey) {
        console.error(`AudioRecorder - Erreur non gérée lors de l'upload audio pour la question ${questionId}:`, error);
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
      
      {uploadedAudioUrl && !isUploading && uploadedAudioUrl !== 'local-audio' && (
        <div className="py-2 mt-2 bg-green-100 rounded-md text-center">
          <span className="text-sm text-green-700">✓ Audio sauvegardé avec succès</span>
        </div>
      )}
      
      {uploadedAudioUrl === 'local-audio' && !isUploading && (
        <div className="py-2 mt-2 bg-yellow-100 rounded-md text-center">
          <span className="text-sm text-yellow-700">⚠ Audio local uniquement</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
