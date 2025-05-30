
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VoiceRecorder from '@/components/VoiceRecorder';

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

  const handleAudioChange = (audioBlob: Blob | null) => {
    if (audioBlob) {
      onAudioRecorded(chapterId, questionId, audioBlob);
    } else {
      onAudioDeleted(chapterId, questionId);
    }
  };

  return (
    <VoiceRecorder
      onAudioChange={handleAudioChange}
    />
  );
};

export default VoiceAnswerRecorder;
