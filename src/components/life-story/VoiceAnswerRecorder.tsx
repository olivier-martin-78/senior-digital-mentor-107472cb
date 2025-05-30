
import React from 'react';
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
}

const VoiceAnswerRecorder: React.FC<VoiceAnswerRecorderProps> = ({
  chapterId,
  questionId,
  onAudioRecorded,
  onAudioDeleted,
  onAudioUrlChange,
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
    
    // Appeler la fonction du parent pour mettre à jour l'état
    onAudioUrlChange(chapterId, questionId, audioUrl, preventAutoSave);
    
    if (audioUrl) {
      // Créer un blob factice pour compatibilité avec l'interface existante
      const dummyBlob = new Blob(['audio'], { type: 'audio/webm' });
      onAudioRecorded(chapterId, questionId, dummyBlob);
    } else {
      // Ne pas afficher de toast lors des changements automatiques
      onAudioDeleted(chapterId, questionId, false);
    }
  };

  const handleDeleteExistingAudio = () => {
    console.log('Suppression de l\'audio existant pour permettre un nouvel enregistrement');
    onAudioUrlChange(chapterId, questionId, null, false);
    onAudioDeleted(chapterId, questionId, true); // Afficher le toast pour la suppression manuelle
  };

  // Si un audio existe déjà, afficher le lecteur
  if (existingAudioUrl) {
    return (
      <VoiceAnswerPlayer
        audioUrl={existingAudioUrl}
        onDelete={handleDeleteExistingAudio}
      />
    );
  }

  // Sinon, afficher l'enregistreur
  return (
    <AudioRecorder
      chapterId={chapterId}
      questionId={questionId}
      onAudioUrlChange={handleAudioUrlChange}
    />
  );
};

export default VoiceAnswerRecorder;
