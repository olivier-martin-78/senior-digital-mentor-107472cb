
import React, { useState } from 'react';
import SimpleAudioRecorder from './SimpleAudioRecorder';
import VoiceAnswerPlayer from '@/components/life-story/VoiceAnswerPlayer';

interface InterventionAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated?: (url: string) => void;
  existingAudioUrl?: string | null;
  isReadOnly?: boolean;
  reportId?: string; // Nouvel paramètre
}

const InterventionAudioRecorder: React.FC<InterventionAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated,
  existingAudioUrl,
  isReadOnly = false,
  reportId
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  
  console.log("🎵 INTERVENTION - InterventionAudioRecorder rendu:", {
    hasExistingUrl: !!existingAudioUrl,
    existingAudioUrl,
    currentAudioUrl: audioUrl,
    isReadOnly,
    reportId
  });
  
  // Normaliser l'URL existante
  const normalizedExistingUrl = (existingAudioUrl && typeof existingAudioUrl === 'string' && existingAudioUrl.trim() !== '') 
    ? existingAudioUrl.trim() 
    : null;

  const handleAudioRecorded = (blob: Blob) => {
    console.log('🎤 INTERVENTION - Audio enregistré dans InterventionAudioRecorder:', blob?.size);
    // Passer le blob au parent IMMÉDIATEMENT
    onAudioRecorded(blob);
  };

  const handleAudioUrlGenerated = (url: string) => {
    console.log('🎵 INTERVENTION - URL audio générée dans InterventionAudioRecorder:', url);
    
    // Si l'URL est vide (suppression), réinitialiser
    if (!url || url.trim() === '') {
      setAudioUrl(null);
      if (onAudioUrlGenerated) {
        onAudioUrlGenerated('');
      }
      return;
    }
    
    setAudioUrl(url);
    if (onAudioUrlGenerated) {
      onAudioUrlGenerated(url);
    }
  };

  const handleDeleteAudio = () => {
    console.log('🗑️ INTERVENTION - Suppression audio dans InterventionAudioRecorder');
    setAudioUrl(null);
    // Notifier le parent avec un blob vide
    const emptyBlob = new Blob([], { type: 'audio/webm' });
    onAudioRecorded(emptyBlob);
    
    // Notifier également que l'URL doit être supprimée
    if (onAudioUrlGenerated) {
      onAudioUrlGenerated('');
    }
  };

  // Si on a une URL audio valide, afficher le lecteur
  const shouldShowPlayer = audioUrl || normalizedExistingUrl;
  
  console.log('🎵 INTERVENTION - Logique d\'affichage:', {
    shouldShowPlayer,
    audioUrl,
    normalizedExistingUrl,
    isReadOnly
  });
  
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
    console.log('🎵 INTERVENTION - Mode lecture seule sans audio, rien à afficher');
    return null;
  }

  // Sinon, afficher l'enregistreur simplifié
  console.log('🎙️ INTERVENTION - Affichage enregistreur simplifié avec reportId:', reportId);
  return (
    <SimpleAudioRecorder
      onAudioRecorded={handleAudioRecorded}
      onAudioUrlGenerated={handleAudioUrlGenerated}
      reportId={reportId}
    />
  );
};

export default InterventionAudioRecorder;
