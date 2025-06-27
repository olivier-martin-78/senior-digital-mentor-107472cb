
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdaptiveVoiceRecorder from '@/components/AdaptiveVoiceRecorder';
import { uploadAdaptiveAudio } from '@/utils/adaptiveAudioUploadUtils';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';

interface AdaptiveAudioRecorderProps {
  chapterId: string;
  questionId: string;
  onAudioUrlChange: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
  onUploadStart?: () => void;
  shouldLog?: boolean;
}

export const AdaptiveAudioRecorder = ({ 
  chapterId, 
  questionId, 
  onAudioUrlChange, 
  onUploadStart, 
  shouldLog = false 
}: AdaptiveAudioRecorderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const { user } = useAuth();
  
  if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
    console.log('🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - Initialisation:', {
      chapterId,
      questionId,
      isUploading,
      uploadedAudioUrl,
      timestamp: new Date().toISOString()
    });
  }
  
  const isMounted = useRef(true);
  const currentUploadRef = useRef<string | null>(null);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log('🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - Démontage du composant');
      }
    };
  }, []);
  
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log("🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - handleAudioChange:", { 
        hasBlob: !!newAudioBlob, 
        blobSize: newAudioBlob?.size,
        blobType: newAudioBlob?.type,
        questionId,
        isUploading,
        currentUpload: currentUploadRef.current,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!newAudioBlob || newAudioBlob.size === 0) {
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log("🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - Audio supprimé ou vide");
      }
      setUploadedAudioUrl(null);
      setIsUploading(false);
      currentUploadRef.current = null;
      onAudioUrlChange(chapterId, questionId, null, false);
      return;
    }
    
    if (!user?.id) {
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log("🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - Pas d'utilisateur connecté");
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
    if (isUploading || currentUploadRef.current === uploadKey) {
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log("🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - Upload déjà en cours:", { uploadKey, isUploading, currentUpload: currentUploadRef.current });
      }
      return;
    }
    
    try {
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log(`🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - Début upload adaptatif:`, {
          size: newAudioBlob.size,
          type: newAudioBlob.type
        });
      }
      
      setIsUploading(true);
      currentUploadRef.current = uploadKey;
      
      if (onUploadStart) {
        if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
          console.log('🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - Signal onUploadStart au parent');
        }
        onUploadStart();
      }
      
      await uploadAdaptiveAudio(
        newAudioBlob,
        user.id,
        chapterId,
        questionId,
        {
          onSuccess: (publicUrl) => {
            if (isMounted.current && currentUploadRef.current === uploadKey) {
              if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
                console.log(`🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - ✅ Upload adaptatif réussi:`, {
                  publicUrl,
                  urlType: typeof publicUrl,
                  urlLength: publicUrl?.length
                });
              }
              
              setUploadedAudioUrl(publicUrl);
              setIsUploading(false);
              currentUploadRef.current = null;
              onAudioUrlChange(chapterId, questionId, publicUrl, false);
              
              toast({
                title: "Enregistrement sauvegardé",
                description: "Votre enregistrement vocal a été sauvegardé avec succès",
                duration: 700
              });
            }
          },
          onError: (errorMessage) => {
            if (isMounted.current && currentUploadRef.current === uploadKey) {
              if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
                console.error(`🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - ❌ Erreur upload:`, errorMessage);
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
          onStart: () => {
            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.log(`🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - 📤 Début téléchargement adaptatif`);
            }
          },
          onEnd: () => {
            if (isMounted.current && currentUploadRef.current === uploadKey) {
              if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
                console.log(`🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - 📥 Fin téléchargement adaptatif`);
              }
              setIsUploading(false);
              currentUploadRef.current = null;
            }
          }
        }
      );
      
    } catch (error) {
      if (isMounted.current && currentUploadRef.current === uploadKey) {
        if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
          console.error(`🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - 💥 Erreur non gérée:`, error);
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

  if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
    console.log('🎙️ ADAPTIVE_AUDIO_RECORDER - Question 1 Chapitre 1 - Rendu avec état:', { 
      isUploading, 
      uploadedAudioUrl,
      timestamp: new Date().toISOString()
    });
  }

  return (
    <div className={`transition-all ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
      <AdaptiveVoiceRecorder onAudioChange={handleAudioChange} />
      
      {isUploading && (
        <div className="flex items-center justify-center py-2 mt-2 bg-blue-100 rounded-md">
          <Spinner className="h-5 w-5 border-blue-500 mr-2" />
          <span className="text-sm text-blue-700">Sauvegarde adaptative en cours...</span>
        </div>
      )}
      
      {uploadedAudioUrl && !isUploading && uploadedAudioUrl !== 'local-audio' && (
        <div className="py-2 mt-2 bg-green-100 rounded-md text-center">
          <span className="text-sm text-green-700">✓ Audio adaptatif sauvegardé avec succès</span>
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

export default AdaptiveAudioRecorder;
