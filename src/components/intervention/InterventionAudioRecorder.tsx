
import React, { useState, useEffect, useRef, useCallback } from 'react';
import DirectAudioRecorder from './DirectAudioRecorder';
import VoiceAnswerPlayer from '@/components/life-story/VoiceAnswerPlayer';

interface InterventionAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated?: (url: string) => void;
  onRecordingStatusChange?: (isRecording: boolean) => void;
  existingAudioUrl?: string | null;
  isReadOnly?: boolean;
  reportId?: string;
}

const InterventionAudioRecorder: React.FC<InterventionAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated,
  onRecordingStatusChange,
  existingAudioUrl,
  isReadOnly = false,
  reportId
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Refs stables pour éviter les re-créations
  const stableCallbacksRef = useRef({
    onAudioRecorded,
    onAudioUrlGenerated,
    onRecordingStatusChange
  });

  // Mettre à jour les refs sans déclencher de re-render
  useEffect(() => {
    stableCallbacksRef.current = {
      onAudioRecorded,
      onAudioUrlGenerated,
      onRecordingStatusChange
    };
  });
  
  console.log("🎵 INTERVENTION - InterventionAudioRecorder rendu SIMPLIFIÉ:", {
    hasExistingUrl: !!existingAudioUrl,
    existingAudioUrl,
    currentAudioUrl: audioUrl,
    isReadOnly,
    reportId
  });

  // Initialisation stable de l'URL existante
  useEffect(() => {
    if (existingAudioUrl && existingAudioUrl.trim() !== '') {
      console.log("🎵 INTERVENTION - Initialisation avec URL existante SIMPLIFIÉ:", existingAudioUrl);
      setAudioUrl(existingAudioUrl.trim());
    } else {
      console.log("🎵 INTERVENTION - Pas d'URL existante SIMPLIFIÉ");
      setAudioUrl(null);
    }
  }, [existingAudioUrl]);

  // Callbacks stables
  const stableHandleAudioRecorded = useCallback((blob: Blob) => {
    console.log('🎤 INTERVENTION - Audio enregistré SIMPLIFIÉ:', blob?.size);
    if (stableCallbacksRef.current.onAudioRecorded) {
      stableCallbacksRef.current.onAudioRecorded(blob);
    }
  }, []);

  const stableHandleAudioUrlGenerated = useCallback((url: string) => {
    console.log('🎵 INTERVENTION - URL audio générée SIMPLIFIÉ:', url);
    
    if (!url || url.trim() === '') {
      console.log('🎵 INTERVENTION - URL vide, suppression SIMPLIFIÉ');
      setAudioUrl(null);
    } else {
      console.log('🎵 INTERVENTION - Nouvelle URL audio SIMPLIFIÉ:', url);
      setAudioUrl(url);
    }
    
    if (stableCallbacksRef.current.onAudioUrlGenerated) {
      stableCallbacksRef.current.onAudioUrlGenerated(url);
    }
  }, []);

  const stableHandleDeleteAudio = useCallback(() => {
    console.log('🗑️ INTERVENTION - Suppression audio SIMPLIFIÉ');
    setAudioUrl(null);
    
    // Notifier le parent avec un blob vide
    if (stableCallbacksRef.current.onAudioRecorded) {
      const emptyBlob = new Blob([], { type: 'audio/webm' });
      stableCallbacksRef.current.onAudioRecorded(emptyBlob);
    }
    
    if (stableCallbacksRef.current.onAudioUrlGenerated) {
      stableCallbacksRef.current.onAudioUrlGenerated('');
    }
  }, []);

  // Logique d'affichage simplifiée et stable
  const currentUrl = audioUrl || existingAudioUrl;
  const hasValidAudioUrl = !!(currentUrl && currentUrl.trim() !== '');
  
  console.log('🎵 INTERVENTION - Logique affichage SIMPLIFIÉ:', {
    hasValidAudioUrl,
    audioUrl,
    existingAudioUrl,
    currentUrl,
    isReadOnly
  });

  // Si on a une URL audio valide, afficher le lecteur
  if (hasValidAudioUrl) {
    console.log('🎵 INTERVENTION - Affichage lecteur avec URL SIMPLIFIÉ:', currentUrl);
    
    return (
      <VoiceAnswerPlayer
        audioUrl={currentUrl!}
        onDelete={isReadOnly ? undefined : stableHandleDeleteAudio}
        readOnly={isReadOnly}
      />
    );
  }

  // Si en mode lecture seule sans audio, ne rien afficher
  if (isReadOnly) {
    console.log('🎵 INTERVENTION - Mode lecture seule sans audio SIMPLIFIÉ');
    return null;
  }

  // Sinon, afficher l'enregistreur direct
  console.log('🎙️ INTERVENTION - Affichage enregistreur direct SIMPLIFIÉ avec reportId:', reportId);
  return (
    <DirectAudioRecorder
      onAudioRecorded={stableHandleAudioRecorded}
      onAudioUrlGenerated={stableHandleAudioUrlGenerated}
      onRecordingStatusChange={stableCallbacksRef.current.onRecordingStatusChange}
      reportId={reportId}
    />
  );
};

export default InterventionAudioRecorder;
