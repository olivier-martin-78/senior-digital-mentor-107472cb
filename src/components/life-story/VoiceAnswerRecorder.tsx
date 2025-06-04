
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AudioRecorder from '@/components/life-story/AudioRecorder';
import VoiceAnswerPlayer from '@/components/life-story/VoiceAnswerPlayer';

interface VoiceAnswerRecorderProps {
  chapterId: string;
  questionId: string;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string, showToast?: boolean) => void;
  onAudioUrlChange: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
  existingAudioUrl?: string | null;
  shouldLog?: boolean;
}

const VoiceAnswerRecorder: React.FC<VoiceAnswerRecorderProps> = ({
  chapterId,
  questionId,
  onAudioRecorded,
  onAudioDeleted,
  onAudioUrlChange,
  existingAudioUrl,
  shouldLog = false,
}) => {
  const { hasRole } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRECTION: Normaliser l'URL existante de manière plus stricte
  const normalizedExistingUrl = (existingAudioUrl && typeof existingAudioUrl === 'string' && existingAudioUrl.trim() !== '') 
    ? existingAudioUrl.trim() 
    : null;
  
  // DEBUG: Log l'état initial avec plus de détails (uniquement si shouldLog)
  if (shouldLog) {
    console.log('🎤 VoiceAnswerRecorder - État initial corrigé:', {
      chapterId,
      questionId,
      existingAudioUrl,
      existingAudioUrlType: typeof existingAudioUrl,
      normalizedExistingUrl,
      hasValidAudio: !!normalizedExistingUrl,
      isUploading,
      isReader: hasRole('reader')
    });
  }
  
  const isReader = hasRole('reader');
  const canRecord = !isReader;

  const handleAudioUrlChange = (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => {
    if (shouldLog) {
      console.log('🎤 VoiceAnswerRecorder - handleAudioUrlChange:', { 
        chapterId, 
        questionId, 
        audioUrl, 
        preventAutoSave: !!preventAutoSave,
        previousUrl: normalizedExistingUrl
      });
    }
    
    // CORRECTION: Forcer la sauvegarde automatique pour les nouveaux audios
    onAudioUrlChange(chapterId, questionId, audioUrl, false);
    
    if (audioUrl && audioUrl.trim() !== '') {
      if (shouldLog) {
        console.log('🎤 VoiceAnswerRecorder - Audio URL reçue, enregistrement réussi');
      }
      // Créer un blob factice pour compatibilité
      const dummyBlob = new Blob(['audio'], { type: 'audio/webm' });
      onAudioRecorded(chapterId, questionId, dummyBlob);
      setIsUploading(false);
    } else {
      if (shouldLog) {
        console.log('🎤 VoiceAnswerRecorder - Suppression audio');
      }
      onAudioDeleted(chapterId, questionId, false);
      setIsUploading(false);
    }
  };

  const handleDeleteExistingAudio = () => {
    if (shouldLog) {
      console.log('🎤 VoiceAnswerRecorder - Suppression manuelle de l\'audio existant');
    }
    // CORRECTION: Forcer la sauvegarde lors de la suppression
    onAudioUrlChange(chapterId, questionId, null, false);
    onAudioDeleted(chapterId, questionId, true);
  };

  const handleUploadStart = () => {
    if (shouldLog) {
      console.log('🎤 VoiceAnswerRecorder - Début upload');
    }
    setIsUploading(true);
  };

  // CORRECTION: Logique simplifiée pour l'affichage
  const shouldShowPlayer = normalizedExistingUrl && !isUploading;
  
  if (shouldLog) {
    console.log('🎤 VoiceAnswerRecorder - Décision d\'affichage:', {
      shouldShowPlayer,
      hasNormalizedUrl: !!normalizedExistingUrl,
      normalizedExistingUrl,
      isUploading,
      isReader,
      canRecord
    });
  }

  // Si un audio valide existe ET qu'on n'est pas en train d'uploader, afficher le lecteur
  if (shouldShowPlayer) {
    if (shouldLog) {
      console.log('🎤 VoiceAnswerRecorder - ✅ Affichage du lecteur avec URL:', normalizedExistingUrl);
    }
    return (
      <VoiceAnswerPlayer
        audioUrl={normalizedExistingUrl}
        onDelete={handleDeleteExistingAudio}
        readOnly={isReader}
        shouldLog={shouldLog}
      />
    );
  }

  // Si pas d'audio existant et que l'utilisateur est un reader, ne rien afficher
  if (isReader) {
    if (shouldLog) {
      console.log('🎤 VoiceAnswerRecorder - Reader sans audio, pas d\'affichage');
    }
    return null;
  }

  // Sinon, afficher l'enregistreur
  if (shouldLog) {
    console.log('🎤 VoiceAnswerRecorder - Affichage de l\'enregistreur');
  }
  return (
    <AudioRecorder
      chapterId={chapterId}
      questionId={questionId}
      onAudioUrlChange={handleAudioUrlChange}
      onUploadStart={handleUploadStart}
      shouldLog={shouldLog}
    />
  );
};

export default VoiceAnswerRecorder;
