
import React, { useState } from 'react';
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
  shouldLog?: boolean;
}

const VoiceAnswerRecorder: React.FC<VoiceAnswerRecorderProps> = ({
  chapterId,
  questionId,
  onAudioRecorded,
  onAudioDeleted,
  onAudioUrlChange,
  existingAudioUrl,
  shouldLog = false,
}) => {
  const { hasRole } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  
  // Normaliser l'URL existante - traiter les chaînes vides comme null
  const normalizedExistingUrl = existingAudioUrl && existingAudioUrl.trim() !== '' ? existingAudioUrl : null;
  
  // DEBUG: Log l'état initial avec plus de détails (uniquement si shouldLog)
  if (shouldLog) {
    console.log('🎤 VoiceAnswerRecorder - État initial détaillé:', {
      chapterId,
      questionId,
      existingAudioUrl,
      normalizedExistingUrl,
      existingAudioUrlType: typeof existingAudioUrl,
      existingAudioUrlLength: existingAudioUrl?.length,
      isUploading,
      hasExistingAudio: !!normalizedExistingUrl,
      isValidUrl: normalizedExistingUrl && normalizedExistingUrl.length > 10,
      isReader: hasRole('reader')
    });
  }
  
  // Les lecteurs peuvent voir le contenu mais ne peuvent pas enregistrer
  const isReader = hasRole('reader');
  const canRecord = !isReader;

  const handleAudioUrlChange = (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => {
    if (shouldLog) {
      console.log('🎤 VoiceAnswerRecorder - handleAudioUrlChange:', { 
        chapterId, 
        questionId, 
        audioUrl, 
        preventAutoSave,
        previousUrl: normalizedExistingUrl,
        urlChanged: audioUrl !== normalizedExistingUrl
      });
    }
    
    // Appeler la fonction du parent pour mettre à jour l'état
    // Ne pas bloquer la sauvegarde automatique
    onAudioUrlChange(chapterId, questionId, audioUrl, false);
    
    if (audioUrl && audioUrl.trim() !== '') {
      if (shouldLog) {
        console.log('🎤 VoiceAnswerRecorder - Audio URL reçue, création blob factice');
      }
      // Créer un blob factice pour compatibilité avec l'interface existante
      const dummyBlob = new Blob(['audio'], { type: 'audio/webm' });
      onAudioRecorded(chapterId, questionId, dummyBlob);
      // Arrêter l'état d'upload une fois l'URL reçue
      setIsUploading(false);
      if (shouldLog) {
        console.log('🎤 VoiceAnswerRecorder - Upload terminé, isUploading = false');
      }
    } else {
      if (shouldLog) {
        console.log('🎤 VoiceAnswerRecorder - Pas d\'URL valide, suppression audio');
      }
      // Ne pas afficher de toast lors des changements automatiques
      onAudioDeleted(chapterId, questionId, false);
      setIsUploading(false);
    }
  };

  const handleDeleteExistingAudio = () => {
    if (shouldLog) {
      console.log('🎤 VoiceAnswerRecorder - Suppression manuelle de l\'audio existant');
    }
    onAudioUrlChange(chapterId, questionId, null, false); // Permettre la sauvegarde
    onAudioDeleted(chapterId, questionId, true); // Afficher le toast pour la suppression manuelle
  };

  // Gérer le début de l'upload
  const handleUploadStart = () => {
    if (shouldLog) {
      console.log('🎤 VoiceAnswerRecorder - Début upload, isUploading = true');
    }
    setIsUploading(true);
  };

  // DEBUG: Log de la décision d'affichage avec plus de détails (uniquement si shouldLog)
  const shouldShowPlayer = normalizedExistingUrl && !isUploading;
  if (shouldLog) {
    console.log('🎤 VoiceAnswerRecorder - Décision d\'affichage détaillée:', {
      shouldShowPlayer,
      normalizedExistingUrl: !!normalizedExistingUrl,
      normalizedExistingUrlValue: normalizedExistingUrl,
      isUploading,
      isReader,
      condition: 'normalizedExistingUrl && !isUploading',
      finalDecision: shouldShowPlayer ? 'LECTEUR' : (canRecord ? 'ENREGISTREUR' : 'RIEN')
    });
  }

  // Si un audio existe déjà ET qu'on n'est pas en train d'uploader, afficher le lecteur
  if (shouldShowPlayer) {
    if (shouldLog) {
      console.log('🎤 VoiceAnswerRecorder - ✅ Affichage du lecteur avec URL:', normalizedExistingUrl);
    }
    return (
      <VoiceAnswerPlayer
        audioUrl={normalizedExistingUrl}
        onDelete={handleDeleteExistingAudio}
        readOnly={isReader}
        shouldLog={shouldLog}
      />
    );
  }

  // Si pas d'audio existant et que l'utilisateur est un reader, ne rien afficher
  if (isReader) {
    if (shouldLog) {
      console.log('🎤 VoiceAnswerRecorder - ⚠️ Reader sans audio existant, pas d\'affichage');
    }
    return null;
  }

  // Sinon, afficher l'enregistreur pour les utilisateurs qui peuvent enregistrer
  if (shouldLog) {
    console.log('🎤 VoiceAnswerRecorder - ⚠️ Affichage de l\'enregistreur (pas d\'audio existant et peut enregistrer)');
  }
  return (
    <AudioRecorder
      chapterId={chapterId}
      questionId={questionId}
      onAudioUrlChange={handleAudioUrlChange}
      onUploadStart={handleUploadStart}
      shouldLog={shouldLog}
    />
  );
};

export default VoiceAnswerRecorder;
