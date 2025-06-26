
import React from 'react';
import SimpleInterventionAudioRecorder from './SimpleInterventionAudioRecorder';

interface InterventionAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated: (url: string) => void;
  existingAudioUrl?: string | null;
  reportId?: string;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const InterventionAudioRecorder: React.FC<InterventionAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated,
  existingAudioUrl,
  reportId,
  onRecordingStateChange
}) => {
  console.log('🎤 InterventionAudioRecorder - Rendu:', {
    hasExistingUrl: !!existingAudioUrl,
    reportId
  });

  return (
    <SimpleInterventionAudioRecorder
      onAudioRecorded={onAudioRecorded}
      onAudioUrlGenerated={onAudioUrlGenerated}
      existingAudioUrl={existingAudioUrl}
      reportId={reportId}
      onRecordingStateChange={onRecordingStateChange}
    />
  );
};

export default InterventionAudioRecorder;
