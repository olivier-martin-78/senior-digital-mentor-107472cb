
import React, { useState } from 'react';
import AudioRecorder from '@/components/life-story/AudioRecorder';
import VoiceAnswerPlayer from '@/components/life-story/VoiceAnswerPlayer';

interface InterventionAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  existingAudioUrl?: string | null;
  isReadOnly?: boolean;
}

const InterventionAudioRecorder: React.FC<InterventionAudioRecorderProps> = ({
  onAudioRecorded,
  existingAudioUrl,
  isReadOnly = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  
  // Normaliser l'URL existante
  const normalizedExistingUrl = (existingAudioUrl && typeof existingAudioUrl === 'string' && existingAudioUrl.trim() !== '') 
    ? existingAudioUrl.trim() 
    : null;

  const handleAudioUrlChange = (chapterId: string, questionId: string, newAudioUrl: string | null) => {
    console.log('🎤 INTERVENTION - handleAudioUrlChange:', { newAudioUrl });
    setAudioUrl(newAudioUrl);
    
    if (newAudioUrl && newAudioUrl.trim() !== '') {
      // Créer un blob factice pour la compatibilité
      const dummyBlob = new Blob(['audio'], { type: 'audio/webm' });
      onAudioRecorded(dummyBlob);
      setIsUploading(false);
    }
  };

  const handleDeleteAudio = () => {
    console.log('🗑️ INTERVENTION - Suppression audio');
    setAudioUrl(null);
    // Notifier le parent avec un blob null ou vide
    const emptyBlob = new Blob([], { type: 'audio/webm' });
    onAudioRecorded(emptyBlob);
  };

  const handleUploadStart = () => {
    console.log('📤 INTERVENTION - Début upload');
    setIsUploading(true);
  };

  // Si on a une URL audio valide et qu'on n'est pas en train d'uploader, afficher le lecteur
  const shouldShowPlayer = (audioUrl || normalizedExistingUrl) && !isUploading;
  
  if (shouldShowPlayer) {
    const urlToUse = audioUrl || normalizedExistingUrl;
    console.log('🎵 INTERVENTION - Affichage lecteur avec URL:', urlToUse);
    
    return (
      <VoiceAnswerPlayer
        audioUrl={urlToUse!}
        onDelete={handleDeleteAudio}
        readOnly={isReadOnly}
      />
    );
  }

  // Si en mode lecture seule sans audio, ne rien afficher
  if (isReadOnly) {
    return null;
  }

  // Sinon, afficher l'enregistreur
  console.log('🎙️ INTERVENTION - Affichage enregistreur');
  return (
    <AudioRecorder
      chapterId="intervention"
      questionId="audio-note"
      onAudioUrlChange={handleAudioUrlChange}
      onUploadStart={handleUploadStart}
    />
  );
};

export default InterventionAudioRecorder;
