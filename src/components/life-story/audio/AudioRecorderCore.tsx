
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VoiceRecorder from '@/components/VoiceRecorder';
import { uploadAudio } from '@/utils/audioUploadUtils';
import { toast } from '@/hooks/use-toast';

interface AudioRecorderCoreProps {
  chapterId: string;
  questionId: string;
  onAudioUrlChange: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
  onUploadStart?: () => void;
  onUploadStateChange: (isUploading: boolean) => void;
  onSavingStateChange: (isSaving: boolean) => void;
  onSavedStateChange: (isSaved: boolean) => void;
  onAudioUrlUpdate: (audioUrl: string | null) => void;
  shouldLog?: boolean;
}

const AudioRecorderCore: React.FC<AudioRecorderCoreProps> = ({
  chapterId,
  questionId,
  onAudioUrlChange,
  onUploadStart,
  onUploadStateChange,
  onSavingStateChange,
  onSavedStateChange,
  onAudioUrlUpdate,
  shouldLog = false
}) => {
  const { user } = useAuth();
  const isMounted = useRef(true);
  const currentUploadRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log('🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - Démontage du composant');
      }
    };
  }, []);

  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log("🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - handleAudioChange:", { 
        hasBlob: !!newAudioBlob, 
        blobSize: newAudioBlob?.size,
        questionId,
        currentUpload: currentUploadRef.current,
        timestamp: new Date().toISOString()
      });
    }

    if (!newAudioBlob || newAudioBlob.size === 0) {
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log("🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - Audio supprimé ou vide");
      }
      onAudioUrlUpdate(null);
      onUploadStateChange(false);
      onSavingStateChange(false);
      onSavedStateChange(false);
      currentUploadRef.current = null;
      onAudioUrlChange(chapterId, questionId, null, false);
      return;
    }

    if (!user?.id) {
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log("🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - Pas d'utilisateur connecté");
      }
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer un audio",
        variant: "destructive",
        duration: 700
      });
      return;
    }

    const uploadKey = `${chapterId}-${questionId}`;
    if (currentUploadRef.current === uploadKey) {
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log("🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - Upload déjà en cours:", { uploadKey, currentUpload: currentUploadRef.current });
      }
      return;
    }

    try {
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log(`🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - Début upload, taille: ${newAudioBlob.size} octets`);
      }
      onUploadStateChange(true);
      onSavingStateChange(false);
      onSavedStateChange(false);
      currentUploadRef.current = uploadKey;

      if (onUploadStart) {
        if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
          console.log('🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - Signal onUploadStart au parent');
        }
        onUploadStart();
      }

      await uploadAudio(
        newAudioBlob,
        user.id,
        chapterId,
        questionId,
        (relativePath) => {
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.log(`🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - ✅ Upload réussi, chemin relatif:`, {
                relativePath,
                pathType: typeof relativePath,
                pathLength: relativePath?.length
              });
            }
            
            // CORRECTION: Transmettre le chemin relatif au lieu de l'URL complète
            onAudioUrlChange(chapterId, questionId, relativePath, false);
            onAudioUrlUpdate(relativePath);
            onUploadStateChange(false);
            onSavingStateChange(true);
            currentUploadRef.current = null;

            setTimeout(() => {
              if (isMounted.current) {
                onSavingStateChange(false);
                onSavedStateChange(true);

                setTimeout(() => {
                  if (isMounted.current) {
                    onSavedStateChange(false);
                  }
                }, 3000);
              }
            }, 1000);

            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.log('🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - Toast de succès affiché');
            }
            toast({
              title: "Enregistrement terminé",
              description: "Votre enregistrement vocal est en cours de sauvegarde...",
              duration: 2000
            });
          } else {
            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.log(`🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - ⚠️ Upload réussi mais composant démonté ou upload différent`);
            }
          }
        },
        (errorMessage) => {
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.error(`🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - ❌ Erreur upload:`, errorMessage);
            }
            onUploadStateChange(false);
            onSavingStateChange(false);
            onSavedStateChange(false);
            currentUploadRef.current = null;

            toast({
              title: "Erreur de sauvegarde",
              description: errorMessage,
              variant: "destructive",
              duration: 700
            });
          }
        },
        () => {
          if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
            console.log(`🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - 📤 Début téléchargement`);
          }
        },
        () => {
          if (isMounted.current && currentUploadRef.current === uploadKey) {
            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.log(`🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - 📥 Fin téléchargement`);
            }
          }
        }
      );
    } catch (error) {
      if (isMounted.current && currentUploadRef.current === uploadKey) {
        if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
          console.error(`🎙️ AUDIO_RECORDER_CORE - Question 1 Chapitre 1 - 💥 Erreur non gérée:`, error);
        }
        onUploadStateChange(false);
        onSavingStateChange(false);
        onSavedStateChange(false);
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

  return <VoiceRecorder onAudioChange={handleAudioChange} />;
};

export default AudioRecorderCore;
