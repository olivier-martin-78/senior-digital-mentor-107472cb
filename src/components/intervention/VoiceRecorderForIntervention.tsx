

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useAuth } from '@/contexts/AuthContext';
import { uploadInterventionAudio, deleteInterventionAudio } from './audio/AudioUploadManager';
import RecordingControls from './audio/RecordingControls';
import PlaybackControls from './audio/PlaybackControls';
import AudioPlayer from './audio/AudioPlayer';
import ExpiredAudioMessage from './audio/ExpiredAudioMessage';
import { validateAndCleanAudioUrl, isExpiredBlobUrl } from '@/utils/audioUrlCleanup';

interface VoiceRecorderForInterventionProps {
  onAudioChange: (audioBlob: Blob | null) => void;
  reportId?: string;
  existingAudioUrl?: string | null;
  disabled?: boolean;
}

const VoiceRecorderForIntervention: React.FC<VoiceRecorderForInterventionProps> = ({
  onAudioChange,
  reportId,
  existingAudioUrl,
  disabled = false
}) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [permanentAudioUrl, setPermanentAudioUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showExpiredMessage, setShowExpiredMessage] = useState(false);

  console.log("🎯 VOICE_RECORDER - Render:", {
    hasExistingUrl: !!existingAudioUrl,
    existingAudioUrl,
    hasPermanentUrl: !!permanentAudioUrl,
    permanentAudioUrl,
    disabled,
    reportId,
    uploadError,
    showExpiredMessage
  });

  // Validation et nettoyage de l'URL existante au chargement
  useEffect(() => {
    const validateExistingAudio = async () => {
      console.log("🎯 VOICE_RECORDER - Validation de l'URL existante:", existingAudioUrl);
      
      if (existingAudioUrl && reportId) {
        const cleanedUrl = await validateAndCleanAudioUrl(existingAudioUrl, reportId);
        
        if (cleanedUrl) {
          console.log("🎯 VOICE_RECORDER - URL audio valide:", cleanedUrl);
          setPermanentAudioUrl(cleanedUrl);
          setShowExpiredMessage(false);
          setUploadError(null);
        } else if (existingAudioUrl) {
          console.log("🎯 VOICE_RECORDER - URL audio expirée détectée");
          setPermanentAudioUrl(null);
          setShowExpiredMessage(true);
          setUploadError(null);
        }
      } else if (existingAudioUrl && !reportId) {
        // Cas sans reportId : vérifier si l'URL est expirée
        if (isExpiredBlobUrl(existingAudioUrl)) {
          console.log("🎯 VOICE_RECORDER - URL blob expirée sans reportId");
          setShowExpiredMessage(true);
          setPermanentAudioUrl(null);
        } else {
          console.log("🎯 VOICE_RECORDER - URL existante sans reportId (probablement valide)");
          setPermanentAudioUrl(existingAudioUrl);
          setShowExpiredMessage(false);
        }
      } else {
        console.log("🎯 VOICE_RECORDER - Pas d'URL existante");
        setPermanentAudioUrl(null);
        setShowExpiredMessage(false);
      }
    };

    validateExistingAudio();
  }, [existingAudioUrl, reportId]);

  const {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    clearRecording
  } = useVoiceRecorder({
    onRecordingComplete: useCallback(async (blob: Blob, url: string) => {
      console.log("🎯 VOICE_RECORDER - Recording complete:", { blobSize: blob.size, url, reportId });
      
      if (blob.size > 0) {
        // Masquer le message d'expiration lors d'un nouvel enregistrement
        setShowExpiredMessage(false);
        
        // Si on a un reportId, toujours uploader vers le stockage permanent
        if (reportId && user) {
          setUploadError(null);
          await uploadInterventionAudio({
            audioBlob: blob,
            reportId,
            userId: user.id,
            onUploadStart: () => setIsUploading(true),
            onUploadEnd: () => setIsUploading(false),
            onSuccess: (publicUrl) => {
              console.log("🎯 VOICE_RECORDER - Upload successful, setting permanent URL:", publicUrl);
              setPermanentAudioUrl(publicUrl);
              onAudioChange(blob);
              setUploadError(null);
            },
            onError: (error) => {
              console.error("🎯 VOICE_RECORDER - Upload failed:", error);
              setUploadError(`Erreur d'upload: ${error}`);
            }
          });
        } else {
          console.log("🎯 VOICE_RECORDER - No reportId, storing temporarily");
          setPermanentAudioUrl(url);
          onAudioChange(blob);
          setUploadError("Impossible de sauvegarder définitivement sans ID de rapport");
        }
      }
    }, [onAudioChange, reportId, user])
  });

  const handleStartRecording = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎯 VOICE_RECORDER - Starting new recording");
    setPermanentAudioUrl(null);
    setUploadError(null);
    setShowExpiredMessage(false);
    startRecording();
  }, [startRecording]);

  const handleStartRecordingSimple = useCallback(() => {
    console.log("🎯 VOICE_RECORDER - Starting new recording (simple)");
    setPermanentAudioUrl(null);
    setUploadError(null);
    setShowExpiredMessage(false);
    startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎯 VOICE_RECORDER - Stopping recording");
    stopRecording();
  }, [stopRecording]);

  const handleClearRecording = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎯 VOICE_RECORDER - Clearing recording");
    
    if (reportId && permanentAudioUrl && user) {
      await deleteInterventionAudio(reportId, permanentAudioUrl, user.id);
    }
    
    clearRecording();
    setPermanentAudioUrl(null);
    setIsPlaying(false);
    setUploadError(null);
    setShowExpiredMessage(false);
    onAudioChange(null);
  }, [clearRecording, onAudioChange, reportId, permanentAudioUrl, user]);

  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎯 VOICE_RECORDER - Play/Pause clicked, current state:", isPlaying);
    setHasUserInteracted(true);
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleAudioPlay = useCallback(() => {
    console.log("🎯 VOICE_RECORDER - Audio started playing");
    setIsPlaying(true);
  }, []);
  
  const handleAudioPause = useCallback(() => {
    console.log("🎯 VOICE_RECORDER - Audio paused");
    setIsPlaying(false);
  }, []);
  
  const handleAudioEnded = useCallback(() => {
    console.log("🎯 VOICE_RECORDER - Audio ended");
    setIsPlaying(false);
  }, []);
  
  const handleAudioError = useCallback((e: any) => {
    console.error("🎯 VOICE_RECORDER - Audio error:", e);
    setIsPlaying(false);
    setUploadError("Erreur de lecture audio");
  }, []);

  // Déterminer l'URL audio à utiliser (priorité : permanentAudioUrl > audioUrl from recording)
  const currentAudioUrl = permanentAudioUrl || audioUrl;
  const hasAudioToDisplay = !!(currentAudioUrl || showExpiredMessage);

  console.log("🎯 VOICE_RECORDER - Audio display logic:", {
    currentAudioUrl,
    hasAudioToDisplay,
    showExpiredMessage,
    isRecording,
    permanentAudioUrl,
    audioUrl
  });

  return (
    <div className="border rounded-lg p-4 bg-white space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Enregistrement vocal</h3>
        
        <RecordingControls
          isRecording={isRecording}
          recordingTime={recordingTime}
          disabled={disabled || isUploading}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
        />
      </div>

      {/* Message d'expiration */}
      {showExpiredMessage && !isRecording && !currentAudioUrl && (
        <ExpiredAudioMessage 
          onRecordNew={handleStartRecordingSimple}
          isRecording={isRecording}
        />
      )}

      {uploadError && (
        <div className="flex items-center justify-center text-red-600 bg-red-50 p-2 rounded">
          <span className="text-sm">{uploadError}</span>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm">Sauvegarde en cours...</span>
        </div>
      )}

      {!reportId && !showExpiredMessage && currentAudioUrl && (
        <div className="flex items-center justify-center text-orange-600 bg-orange-50 p-2 rounded">
          <span className="text-sm">⚠️ Sauvegarde temporaire uniquement - Enregistrez d'abord le rapport</span>
        </div>
      )}

      {currentAudioUrl && !isRecording && (
        <PlaybackControls
          isPlaying={isPlaying}
          disabled={isUploading}
          onPlayPause={handlePlayPause}
          onDelete={handleClearRecording}
        />
      )}

      {currentAudioUrl && (
        <AudioPlayer
          audioUrl={currentAudioUrl}
          onPlay={handleAudioPlay}
          onPause={handleAudioPause}
          onEnded={handleAudioEnded}
          onError={handleAudioError}
        />
      )}
    </div>
  );
};

export default VoiceRecorderForIntervention;
