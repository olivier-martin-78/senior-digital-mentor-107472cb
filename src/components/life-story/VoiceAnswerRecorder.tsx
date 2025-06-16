
import React, { useState } from 'react';
import AudioRecorder from '@/components/life-story/AudioRecorder';
import VoiceAnswerPlayer from '@/components/life-story/VoiceAnswerPlayer';

interface VoiceAnswerRecorderProps {
  chapterId: string;
  questionId: string;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string, showToast?: boolean) => void;
  onAudioUrlChange: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
  existingAudioUrl?: string | null;
  isReadOnly: boolean;
  shouldLog?: boolean;
}

const VoiceAnswerRecorder: React.FC<VoiceAnswerRecorderProps> = ({
  chapterId,
  questionId,
  onAudioRecorded,
  onAudioDeleted,
  onAudioUrlChange,
  existingAudioUrl,
  isReadOnly,
  shouldLog = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  
  // Normaliser l'URL existante de manière plus stricte
  const normalizedExistingUrl = (existingAudioUrl && typeof existingAudioUrl === 'string' && existingAudioUrl.trim() !== '') 
    ? existingAudioUrl.trim() 
    : null;
  
  // DEBUG: Log l'état initial avec plus de détails
  if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
    console.log('🎤 RECORDER - Question 1 Chapitre 1 - État initial:', {
      chapterId,
      questionId,
      existingAudioUrl,
      existingAudioUrlType: typeof existingAudioUrl,
      normalizedExistingUrl,
      hasValidAudio: !!normalizedExistingUrl,
      isUploading,
      isReadOnly,
      canRecord: !isReadOnly,
      timestamp: new Date().toISOString()
    });
  }
  
  const canRecord = !isReadOnly;

  const handleAudioUrlChange = (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => {
    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🎤 RECORDER - Question 1 Chapitre 1 - handleAudioUrlChange (RECORDER):', { 
        chapterId, 
        questionId, 
        audioUrl, 
        audioUrlType: typeof audioUrl,
        preventAutoSave: !!preventAutoSave,
        previousUrl: normalizedExistingUrl,
        timestamp: new Date().toISOString()
      });
    }
    
    // Toujours permettre la sauvegarde automatique
    onAudioUrlChange(chapterId, questionId, audioUrl, false);
    
    if (audioUrl && audioUrl.trim() !== '') {
      // LOG DÉTAILLÉ pour question 1 chapitre 1
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log('🎤 RECORDER - Question 1 Chapitre 1 - Audio URL reçue, enregistrement réussi (RECORDER):', {
          audioUrl,
          audioUrlLength: audioUrl.length
        });
      }
      // Appeler onAudioRecorded APRÈS la mise à jour de l'URL
      const dummyBlob = new Blob(['audio'], { type: 'audio/webm' });
      onAudioRecorded(chapterId, questionId, dummyBlob);
      setIsUploading(false);
    } else {
      // LOG DÉTAILLÉ pour question 1 chapitre 1
      if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
        console.log('🎤 RECORDER - Question 1 Chapitre 1 - Suppression audio (RECORDER)');
      }
      onAudioDeleted(chapterId, questionId, false);
      setIsUploading(false);
    }
  };

  const handleDeleteExistingAudio = () => {
    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🎤 RECORDER - Question 1 Chapitre 1 - Suppression manuelle de l\'audio existant');
    }
    // Forcer la sauvegarde lors de la suppression
    onAudioUrlChange(chapterId, questionId, null, false);
    onAudioDeleted(chapterId, questionId, true);
  };

  const handleUploadStart = () => {
    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🎤 RECORDER - Question 1 Chapitre 1 - Début upload');
    }
    setIsUploading(true);
  };

  // Logique simplifiée pour l'affichage
  const shouldShowPlayer = normalizedExistingUrl && !isUploading;
  
  // LOG DÉTAILLÉ pour question 1 chapitre 1
  if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
    console.log('🎤 RECORDER - Question 1 Chapitre 1 - Décision d\'affichage:', {
      shouldShowPlayer,
      hasNormalizedUrl: !!normalizedExistingUrl,
      normalizedExistingUrl,
      isUploading,
      isReadOnly,
      canRecord
    });
  }

  // Si un audio valide existe ET qu'on n'est pas en train d'uploader, afficher le lecteur
  if (shouldShowPlayer) {
    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🎤 RECORDER - Question 1 Chapitre 1 - ✅ Affichage du lecteur avec URL:', normalizedExistingUrl);
    }
    return (
      <VoiceAnswerPlayer
        audioUrl={normalizedExistingUrl}
        onDelete={handleDeleteExistingAudio}
        readOnly={isReadOnly}
        shouldLog={shouldLog && chapterId === 'chapter-1' && questionId === 'question-1'}
      />
    );
  }

  // Si pas d'audio existant et que l'utilisateur est en lecture seule, ne rien afficher
  if (isReadOnly) {
    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🎤 RECORDER - Question 1 Chapitre 1 - Mode lecture seule sans audio, pas d\'affichage');
    }
    return null;
  }

  // Sinon, afficher l'enregistreur
  // LOG DÉTAILLÉ pour question 1 chapitre 1
  if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
    console.log('🎤 RECORDER - Question 1 Chapitre 1 - Affichage de l\'enregistreur');
  }
  return (
    <AudioRecorder
      chapterId={chapterId}
      questionId={questionId}
      onAudioUrlChange={handleAudioUrlChange}
      onUploadStart={handleUploadStart}
      shouldLog={shouldLog && chapterId === 'chapter-1' && questionId === 'question-1'}
    />
  );
};

export default VoiceAnswerRecorder;
