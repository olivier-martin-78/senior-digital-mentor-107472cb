
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AudioRecorder from '@/components/life-story/AudioRecorder';

interface VoiceAnswerRecorderProps {
  chapterId: string;
  questionId: string;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
  existingAudioUrl?: string | null;
}

const VoiceAnswerRecorder: React.FC<VoiceAnswerRecorderProps> = ({
  chapterId,
  questionId,
  onAudioRecorded,
  onAudioDeleted,
  existingAudioUrl,
}) => {
  const { hasRole } = useAuth();
  
  // Les lecteurs ne peuvent pas enregistrer d'audio
  const canRecord = !hasRole('reader');

  if (!canRecord) {
    return null;
  }

  const handleAudioUrlChange = (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => {
    console.log('AudioURL change dans VoiceAnswerRecorder:', { chapterId, questionId, audioUrl, preventAutoSave });
    
    if (audioUrl) {
      // Créer un blob factice pour compatibilité avec l'interface existante
      // Le vrai blob est géré par AudioRecorder et uploadé vers Supabase
      const dummyBlob = new Blob(['audio'], { type: 'audio/webm' });
      onAudioRecorded(chapterId, questionId, dummyBlob);
    } else {
      onAudioDeleted(chapterId, questionId);
    }
  };

  return (
    <AudioRecorder
      chapterId={chapterId}
      questionId={questionId}
      onAudioUrlChange={handleAudioUrlChange}
    />
  );
};

export default VoiceAnswerRecorder;
