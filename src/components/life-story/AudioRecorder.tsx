
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
  
  // DEBUG: Log l'état initial (uniquement pour question 1 chapitre 1)
  if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
    console.log('🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Initialisation:', {
      chapterId,
      questionId,
      isUploading,
      uploadedAudioUrl,
      timestamp: new Date().toISOString()
    });
  }
  
  // Utiliser des refs pour éviter les uploads multiples
  const isMounted = useRef(true);
  const currentUploadRef = useRef<string | null>(null);
  
  // Effet de nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log('🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Démontage du composant');
      }
    };
  }, []);
  
  // Gestion de l'enregistrement audio
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log("🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - handleAudioChange:", { 
        hasBlob: !!newAudioBlob, 
        blobSize: newAudioBlob?.size,
        questionId,
        isUploading,
        currentUpload: currentUploadRef.current,
        timestamp: new Date().toISOString()
      });
    }
    
    // Si pas de blob, audio supprimé
    if (!newAudioBlob || newAudioBlob.size === 0) {
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log("🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Audio supprimé ou vide");
      }
      setUploadedAudioUrl(null);
      setIsUploading(false);
      currentUploadRef.current = null;
      onAudioUrlChange(chapterId, questionId, null, false); // Permettre la sauvegarde
      return;
    }
    
    // Si pas d'utilisateur, ne rien faire
    if (!user?.id) {
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log("🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Pas d'utilisateur connecté");
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
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log("🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Upload déjà en cours:", { uploadKey, isUploading, currentUpload: currentUploadRef.current });
      }
      return;
    }
    
    try {
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log(`🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Début upload, taille: ${newAudioBlob.size} octets`);
      }
      setIsUploading(true);
      currentUploadRef.current = uploadKey;
      
      // Signaler le début de l'upload au parent
      if (onUploadStart) {
        if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
          console.log('🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Signal onUploadStart au parent');
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
            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.log(`🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - ✅ Upload réussi, URL:`, {
                publicUrl,
                urlType: typeof publicUrl,
                urlLength: publicUrl?.length
              });
            }
            setUploadedAudioUrl(publicUrl);
            setIsUploading(false);
            currentUploadRef.current = null;
            // Permettre la sauvegarde automatique
            onAudioUrlChange(chapterId, questionId, publicUrl, false);
            
            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.log('🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Toast de succès affiché');
            }
            toast({
              title: "Enregistrement sauvegardé",
              description: "Votre enregistrement vocal a été sauvegardé avec succès",
              duration: 700
            });
          } else {
            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.log(`🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - ⚠️ Upload réussi mais composant démonté ou upload différent`);
            }
          }
        },
        // Callback d'erreur
        (errorMessage) => {
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.error(`🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - ❌ Erreur upload:`, errorMessage);
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
          if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
            console.log(`🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - 📤 Début téléchargement`);
          }
        },
        // Callback de fin d'upload
        () => {
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.log(`🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - 📥 Fin téléchargement`);
            }
            setIsUploading(false);
            currentUploadRef.current = null;
          }
        }
      );
    } catch (error) {
      if (isMounted.current && currentUploadRef.current === uploadKey) {
        if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
          console.error(`🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - 💥 Erreur non gérée:`, error);
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

  // LOG DÉTAILLÉ pour question 1 chapitre 1
  if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
    console.log('🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Rendu avec état:', { 
      isUploading, 
      uploadedAudioUrl,
      timestamp: new Date().toISOString()
    });
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
