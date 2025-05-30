
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

  const handleAudioRecorded = (blob: Blob) => {
    onAudioRecorded(chapterId, questionId, blob);
  };

  const handleAudioDeleted = () => {
    onAudioDeleted(chapterId, questionId);
  };

  return (
    <VoiceRecorder
      onRecordingComplete={handleAudioRecorded}
      onDeleteRecording={handleAudioDeleted}
      existingAudioUrl={existingAudioUrl}
    />
  );
};

export default VoiceAnswerRecorder;
