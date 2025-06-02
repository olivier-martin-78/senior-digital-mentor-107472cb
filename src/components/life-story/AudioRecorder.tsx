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
  onUploadStart?: () => void;
  shouldLog?: boolean;
}

export const AudioRecorder = ({ chapterId, questionId, onAudioUrlChange, onUploadStart, shouldLog = false }: AudioRecorderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const { user } = useAuth();
  
  // DEBUG: Log l'état initial
  if (shouldLog) {
    console.log('🎙️ AudioRecorder - Initialisation:', {
      chapterId,
      questionId,
      isUploading,
      uploadedAudioUrl
    });
  }
  
  // Utiliser des refs pour éviter les uploads multiples
  const isMounted = useRef(true);
  const currentUploadRef = useRef<string | null>(null);
  
  // Effet de nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      isMounted.current = false;
      console.log('🎙️ AudioRecorder - Démontage du composant');
    };
  }, []);
  
  // Gestion de l'enregistrement audio
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    if (shouldLog) {
      console.log("🎙️ AudioRecorder - handleAudioChange:", { 
        hasBlob: !!newAudioBlob, 
        blobSize: newAudioBlob?.size,
        questionId,
        isUploading,
        currentUpload: currentUploadRef.current
      });
    }
    
    // Si pas de blob, audio supprimé
    if (!newAudioBlob || newAudioBlob.size === 0) {
      if (shouldLog) {
        console.log("🎙️ AudioRecorder - Audio supprimé ou vide");
      }
      setUploadedAudioUrl(null);
      setIsUploading(false);
      currentUploadRef.current = null;
      onAudioUrlChange(chapterId, questionId, null, false); // Permettre la sauvegarde
      return;
    }
    
    // Si pas d'utilisateur, ne rien faire
    if (!user?.id) {
      if (shouldLog) {
        console.log("🎙️ AudioRecorder - Pas d'utilisateur connecté");
      }
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer un audio",
        variant: "destructive",
        duration: 700
      });
      return;
    }
    
    // Vérifier si un upload est déjà en cours pour cette question
    const uploadKey = `${chapterId}-${questionId}`;
    if (isUploading || currentUploadRef.current === uploadKey) {
      if (shouldLog) {
        console.log("🎙️ AudioRecorder - Upload déjà en cours:", { uploadKey, isUploading, currentUpload: currentUploadRef.current });
      }
      return;
    }
    
    try {
      if (shouldLog) {
        console.log(`🎙️ AudioRecorder - Début upload pour ${questionId}, taille: ${newAudioBlob.size} octets`);
      }
      setIsUploading(true);
      currentUploadRef.current = uploadKey;
      
      // Signaler le début de l'upload au parent
      if (onUploadStart) {
        if (shouldLog) {
          console.log('🎙️ AudioRecorder - Signal onUploadStart au parent');
        }
        onUploadStart();
      }
      
      // Tentative de téléchargement de l'audio
      await uploadAudio(
        newAudioBlob,
        user.id,
        chapterId,
        questionId,
        // Callback de succès
        (publicUrl) => {
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            if (shouldLog) {
              console.log(`🎙️ AudioRecorder - ✅ Upload réussi pour ${questionId}, URL:`, publicUrl);
            }
            setUploadedAudioUrl(publicUrl);
            setIsUploading(false);
            currentUploadRef.current = null;
            // Permettre la sauvegarde automatique
            onAudioUrlChange(chapterId, questionId, publicUrl, false);
            
            if (shouldLog) {
              console.log('🎙️ AudioRecorder - Toast de succès affiché');
            }
            toast({
              title: "Enregistrement sauvegardé",
              description: "Votre enregistrement vocal a été sauvegardé avec succès",
              duration: 700
            });
          } else {
            if (shouldLog) {
              console.log(`🎙️ AudioRecorder - ⚠️ Upload réussi mais composant démonté ou upload différent`);
            }
          }
        },
        // Callback d'erreur
        (errorMessage) => {
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            if (shouldLog) {
              console.error(`🎙️ AudioRecorder - ❌ Erreur upload pour ${questionId}:`, errorMessage);
            }
            setIsUploading(false);
            currentUploadRef.current = null;
            
            toast({
              title: "Erreur de sauvegarde",
              description: errorMessage,
              variant: "destructive",
              duration: 700
            });
          }
        },
        // Callback de début d'upload
        () => {
          if (shouldLog) {
            console.log(`🎙️ AudioRecorder - 📤 Début téléchargement pour ${questionId}`);
          }
        },
        // Callback de fin d'upload
        () => {
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            if (shouldLog) {
              console.log(`🎙️ AudioRecorder - 📥 Fin téléchargement pour ${questionId}`);
            }
            setIsUploading(false);
            currentUploadRef.current = null;
          }
        }
      );
    } catch (error) {
      if (isMounted.current && currentUploadRef.current === uploadKey) {
        if (shouldLog) {
          console.error(`🎙️ AudioRecorder - 💥 Erreur non gérée pour ${questionId}:`, error);
        }
        setIsUploading(false);
        currentUploadRef.current = null;
        
        toast({
          title: "Erreur inattendue",
          description: "Une erreur est survenue lors du téléchargement de l'audio",
          variant: "destructive",
          duration: 700
        });
      }
    }
  };

  if (shouldLog) {
    console.log('🎙️ AudioRecorder - Rendu avec état:', { isUploading, uploadedAudioUrl });
  }

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
