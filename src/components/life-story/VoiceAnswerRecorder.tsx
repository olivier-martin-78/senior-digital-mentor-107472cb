
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
  const [isUploading, setIsUploading] = useState(false);
  
  // DEBUG: Log l'état initial avec plus de détails
  console.log('🎤 VoiceAnswerRecorder - État initial détaillé:', {
    chapterId,
    questionId,
    existingAudioUrl,
    existingAudioUrlType: typeof existingAudioUrl,
    existingAudioUrlLength: existingAudioUrl?.length,
    isUploading,
    hasExistingAudio: !!existingAudioUrl,
    isValidUrl: existingAudioUrl && existingAudioUrl.length > 10,
    isReader: hasRole('reader')
  });
  
  // Les lecteurs peuvent voir le contenu mais ne peuvent pas enregistrer
  const isReader = hasRole('reader');
  const canRecord = !isReader;

  const handleAudioUrlChange = (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => {
    console.log('🎤 VoiceAnswerRecorder - handleAudioUrlChange:', { 
      chapterId, 
      questionId, 
      audioUrl, 
      preventAutoSave,
      previousUrl: existingAudioUrl,
      urlChanged: audioUrl !== existingAudioUrl
    });
    
    // Appeler la fonction du parent pour mettre à jour l'état
    // Ne pas bloquer la sauvegarde automatique
    onAudioUrlChange(chapterId, questionId, audioUrl, false);
    
    if (audioUrl) {
      console.log('🎤 VoiceAnswerRecorder - Audio URL reçue, création blob factice');
      // Créer un blob factice pour compatibilité avec l'interface existante
      const dummyBlob = new Blob(['audio'], { type: 'audio/webm' });
      onAudioRecorded(chapterId, questionId, dummyBlob);
      // Arrêter l'état d'upload une fois l'URL reçue
      setIsUploading(false);
      console.log('🎤 VoiceAnswerRecorder - Upload terminé, isUploading = false');
    } else {
      console.log('🎤 VoiceAnswerRecorder - Pas d\'URL, suppression audio');
      // Ne pas afficher de toast lors des changements automatiques
      onAudioDeleted(chapterId, questionId, false);
      setIsUploading(false);
    }
  };

  const handleDeleteExistingAudio = () => {
    console.log('🎤 VoiceAnswerRecorder - Suppression manuelle de l\'audio existant');
    onAudioUrlChange(chapterId, questionId, null, false); // Permettre la sauvegarde
    onAudioDeleted(chapterId, questionId, true); // Afficher le toast pour la suppression manuelle
  };

  // Gérer le début de l'upload
  const handleUploadStart = () => {
    console.log('🎤 VoiceAnswerRecorder - Début upload, isUploading = true');
    setIsUploading(true);
  };

  // DEBUG: Log de la décision d'affichage avec plus de détails
  const shouldShowPlayer = existingAudioUrl && !isUploading;
  console.log('🎤 VoiceAnswerRecorder - Décision d\'affichage détaillée:', {
    shouldShowPlayer,
    existingAudioUrl: !!existingAudioUrl,
    existingAudioUrlValue: existingAudioUrl,
    isUploading,
    isReader,
    condition: 'existingAudioUrl && !isUploading',
    finalDecision: shouldShowPlayer ? 'LECTEUR' : (canRecord ? 'ENREGISTREUR' : 'RIEN')
  });

  // Si un audio existe déjà ET qu'on n'est pas en train d'uploader, afficher le lecteur
  if (shouldShowPlayer) {
    console.log('🎤 VoiceAnswerRecorder - ✅ Affichage du lecteur avec URL:', existingAudioUrl);
    return (
      <VoiceAnswerPlayer
        audioUrl={existingAudioUrl}
        onDelete={handleDeleteExistingAudio}
        readOnly={isReader}
      />
    );
  }

  // Si pas d'audio existant et que l'utilisateur est un reader, ne rien afficher
  if (isReader) {
    console.log('🎤 VoiceAnswerRecorder - ⚠️ Reader sans audio existant, pas d\'affichage');
    return null;
  }

  // Sinon, afficher l'enregistreur pour les utilisateurs qui peuvent enregistrer
  console.log('🎤 VoiceAnswerRecorder - ⚠️ Affichage de l\'enregistreur (pas d\'audio existant et peut enregistrer)');
  return (
    <AudioRecorder
      chapterId={chapterId}
      questionId={questionId}
      onAudioUrlChange={handleAudioUrlChange}
      onUploadStart={handleUploadStart}
    />
  );
};

export default VoiceAnswerRecorder;
