
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VoiceRecorder from '@/components/VoiceRecorder';
import { uploadAudio } from '@/utils/audioUploadUtils';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, Clock } from 'lucide-react';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
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
      setIsSaving(false);
      setIsSaved(false);
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
      setIsSaving(false);
      setIsSaved(false);
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
            setIsSaving(true); // Début de la sauvegarde
            currentUploadRef.current = null;
            
            // CORRECTION: Transmission immédiate avec notification de sauvegarde
            onAudioUrlChange(chapterId, questionId, publicUrl, false);
            
            // Simuler un délai pour montrer l'état de sauvegarde
            setTimeout(() => {
              if (isMounted.current) {
                setIsSaving(false);
                setIsSaved(true);
                
                // Masquer l'indicateur de succès après 3 secondes
                setTimeout(() => {
                  if (isMounted.current) {
                    setIsSaved(false);
                  }
                }, 3000);
              }
            }, 1000);
            
            if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
              console.log('🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Toast de succès affiché');
            }
            toast({
              title: "Enregistrement terminé",
              description: "Votre enregistrement vocal est en cours de sauvegarde...",
              duration: 2000
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
            setIsSaving(false);
            setIsSaved(false);
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
            // Ne pas remettre isUploading à false ici, c'est fait dans le callback de succès
          }
        }
      );
    } catch (error) {
      if (isMounted.current && currentUploadRef.current === uploadKey) {
        if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
          console.error(`🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - 💥 Erreur non gérée:`, error);
        }
        setIsUploading(false);
        setIsSaving(false);
        setIsSaved(false);
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
      isSaving,
      isSaved,
      timestamp: new Date().toISOString()
    });
  }

  return (
    <div className={`transition-all ${isUploading || isSaving ? "opacity-60 pointer-events-none" : ""}`}>
      <VoiceRecorder onAudioChange={handleAudioChange} />
      
      {isUploading && (
        <div className="flex items-center justify-center py-2 mt-2 bg-blue-50 border border-blue-200 rounded-md">
          <Spinner className="h-5 w-5 border-blue-500 mr-2" />
          <span className="text-sm text-blue-700">Téléchargement en cours...</span>
        </div>
      )}
      
      {isSaving && !isUploading && (
        <div className="flex items-center justify-center py-2 mt-2 bg-orange-50 border border-orange-200 rounded-md">
          <Clock className="h-5 w-5 text-orange-500 mr-2" />
          <span className="text-sm text-orange-700">Sauvegarde automatique en cours...</span>
        </div>
      )}
      
      {isSaved && !isSaving && !isUploading && (
        <div className="flex items-center justify-center py-2 mt-2 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-sm text-green-700">✓ Enregistrement sauvegardé automatiquement</span>
        </div>
      )}
      
      {uploadedAudioUrl && !isUploading && !isSaving && !isSaved && uploadedAudioUrl !== 'local-audio' && (
        <div className="py-2 mt-2 bg-gray-100 rounded-md text-center">
          <span className="text-sm text-gray-600">Audio disponible</span>
        </div>
      )}
      
      {uploadedAudioUrl === 'local-audio' && !isUploading && !isSaving && (
        <div className="py-2 mt-2 bg-yellow-100 rounded-md text-center">
          <span className="text-sm text-yellow-700">⚠ Audio local uniquement</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
