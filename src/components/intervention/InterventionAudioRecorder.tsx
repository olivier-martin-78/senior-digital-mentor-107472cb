
import React, { useState, useEffect } from 'react';
import SimpleAudioRecorder from './SimpleAudioRecorder';
import VoiceAnswerPlayer from '@/components/life-story/VoiceAnswerPlayer';

interface InterventionAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated?: (url: string) => void;
  existingAudioUrl?: string | null;
  isReadOnly?: boolean;
  reportId?: string;
}

const InterventionAudioRecorder: React.FC<InterventionAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated,
  existingAudioUrl,
  isReadOnly = false,
  reportId
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  console.log("🎵 INTERVENTION - InterventionAudioRecorder rendu:", {
    hasExistingUrl: !!existingAudioUrl,
    existingAudioUrl,
    currentAudioUrl: audioUrl,
    isReadOnly,
    reportId
  });

  // Initialiser avec l'URL existante si disponible
  useEffect(() => {
    if (existingAudioUrl && existingAudioUrl.trim() !== '') {
      console.log("🎵 INTERVENTION - Initialisation avec URL existante:", existingAudioUrl);
      setAudioUrl(existingAudioUrl.trim());
    } else {
      console.log("🎵 INTERVENTION - Pas d'URL existante ou URL vide");
      setAudioUrl(null);
    }
  }, [existingAudioUrl]);

  const handleAudioRecorded = (blob: Blob) => {
    console.log('🎤 INTERVENTION - Audio enregistré:', blob?.size);
    onAudioRecorded(blob);
  };

  const handleAudioUrlGenerated = (url: string) => {
    console.log('🎵 INTERVENTION - URL audio générée:', url);
    
    if (!url || url.trim() === '') {
      console.log('🎵 INTERVENTION - URL vide, suppression');
      setAudioUrl(null);
    } else {
      console.log('🎵 INTERVENTION - Nouvelle URL audio:', url);
      setAudioUrl(url);
    }
    
    if (onAudioUrlGenerated) {
      onAudioUrlGenerated(url);
    }
  };

  const handleDeleteAudio = () => {
    console.log('🗑️ INTERVENTION - Suppression audio');
    setAudioUrl(null);
    
    // Notifier le parent avec un blob vide
    const emptyBlob = new Blob([], { type: 'audio/webm' });
    onAudioRecorded(emptyBlob);
    
    if (onAudioUrlGenerated) {
      onAudioUrlGenerated('');
    }
  };

  // Déterminer ce qui doit être affiché
  const currentUrl = audioUrl || existingAudioUrl;
  const hasValidAudioUrl = !!(currentUrl && currentUrl.trim() !== '');
  
  console.log('🎵 INTERVENTION - Logique d\'affichage:', {
    hasValidAudioUrl,
    audioUrl,
    existingAudioUrl,
    currentUrl,
    isReadOnly
  });

  // Si on a une URL audio valide, afficher le lecteur
  if (hasValidAudioUrl) {
    console.log('🎵 INTERVENTION - Affichage lecteur avec URL:', currentUrl);
    
    return (
      <VoiceAnswerPlayer
        audioUrl={currentUrl!}
        onDelete={isReadOnly ? undefined : handleDeleteAudio}
        readOnly={isReadOnly}
      />
    );
  }

  // Si en mode lecture seule sans audio, ne rien afficher
  if (isReadOnly) {
    console.log('🎵 INTERVENTION - Mode lecture seule sans audio');
    return null;
  }

  // Sinon, afficher l'enregistreur simplifié
  console.log('🎙️ INTERVENTION - Affichage enregistreur avec reportId:', reportId);
  return (
    <SimpleAudioRecorder
      onAudioRecorded={handleAudioRecorded}
      onAudioUrlGenerated={handleAudioUrlGenerated}
      reportId={reportId}
    />
  );
};

export default InterventionAudioRecorder;
