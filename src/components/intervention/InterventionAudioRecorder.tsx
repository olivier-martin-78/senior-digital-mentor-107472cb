
import React from 'react';
import VoiceAnswerPlayer from '@/components/life-story/VoiceAnswerPlayer';
import SimpleInterventionAudioRecorder from './SimpleInterventionAudioRecorder';

interface InterventionAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated: (url: string) => void;
  existingAudioUrl?: string | null;
  reportId?: string;
}

const InterventionAudioRecorder: React.FC<InterventionAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated,
  existingAudioUrl,
  reportId
}) => {
  console.log('🎤 NEW_InterventionAudioRecorder - Rendu:', {
    hasExistingUrl: !!existingAudioUrl,
    reportId
  });

  const handleDeleteExistingAudio = () => {
    console.log('🗑️ NEW_InterventionAudioRecorder - Suppression audio existant');
    onAudioUrlGenerated('');
  };

  // Si on a de l'audio existant, afficher le lecteur
  if (existingAudioUrl) {
    console.log('🎤 NEW_InterventionAudioRecorder - Affichage du lecteur pour audio existant');
    return (
      <VoiceAnswerPlayer
        audioUrl={existingAudioUrl}
        onDelete={handleDeleteExistingAudio}
        readOnly={false}
        shouldLog={true}
      />
    );
  }

  // Sinon afficher l'enregistreur
  console.log('🎤 NEW_InterventionAudioRecorder - Affichage de l\'enregistreur');
  return (
    <SimpleInterventionAudioRecorder
      onAudioRecorded={onAudioRecorded}
      onAudioUrlGenerated={onAudioUrlGenerated}
      reportId={reportId}
    />
  );
};

export default InterventionAudioRecorder;
