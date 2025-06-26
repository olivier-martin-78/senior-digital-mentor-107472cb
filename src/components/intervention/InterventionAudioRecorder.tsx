
import React from 'react';
import VoiceAnswerPlayer from '@/components/life-story/VoiceAnswerPlayer';
import AudioUploadProgress from './audio/AudioUploadProgress';
import VoiceRecorderSimple from './audio/VoiceRecorderSimple';
import { useAudioProcessor } from './audio/AudioProcessor';

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
  const { processAudio, audioState } = useAudioProcessor({
    onAudioRecorded,
    onAudioUrlGenerated,
    reportId
  });
  
  console.log('🎤 InterventionAudioRecorder - Rendu:', {
    isUploading: audioState.isUploading,
    uploadedAudioUrl: audioState.uploadedAudioUrl,
    hasExistingUrl: !!existingAudioUrl,
    reportId,
    isProcessing: audioState.isProcessing
  });

  const handleDeleteExistingAudio = () => {
    console.log('🎤 InterventionAudioRecorder - Suppression manuelle de l\'audio');
    audioState.clearAudio();
    onAudioUrlGenerated('');
  };

  // Utiliser l'URL existante ou l'URL uploadée
  const currentAudioUrl = audioState.uploadedAudioUrl || existingAudioUrl;

  // Afficher le lecteur si on a de l'audio et qu'on n'est pas en train d'uploader
  if (currentAudioUrl && !audioState.isUploading) {
    console.log('🎤 InterventionAudioRecorder - ✅ Affichage du lecteur');
    return (
      <div className="space-y-4">
        <VoiceAnswerPlayer
          audioUrl={currentAudioUrl}
          onDelete={handleDeleteExistingAudio}
          readOnly={false}
          shouldLog={true}
        />
        <AudioUploadProgress isUploading={audioState.isUploading} />
      </div>
    );
  }

  console.log('🎤 InterventionAudioRecorder - Affichage de l\'enregistreur');
  return (
    <div className={`transition-all ${audioState.isUploading ? "opacity-60 pointer-events-none" : ""}`}>
      <VoiceRecorderSimple onAudioChange={processAudio} />
      <AudioUploadProgress isUploading={audioState.isUploading} />
    </div>
  );
};

export default InterventionAudioRecorder;
