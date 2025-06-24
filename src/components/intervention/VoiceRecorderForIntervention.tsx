
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useAuth } from '@/contexts/AuthContext';
import { uploadInterventionAudio, deleteInterventionAudio } from './audio/AudioUploadManager';
import RecordingControls from './audio/RecordingControls';
import PlaybackControls from './audio/PlaybackControls';
import AudioPlayer from './audio/AudioPlayer';

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

  console.log("🎯 VOICE_RECORDER - Render:", {
    hasExistingUrl: !!existingAudioUrl,
    existingAudioUrl,
    hasPermanentUrl: !!permanentAudioUrl,
    permanentAudioUrl,
    disabled,
    reportId
  });

  // Initialiser l'URL permanente avec l'URL existante
  useEffect(() => {
    if (existingAudioUrl && existingAudioUrl.trim() !== '' && !existingAudioUrl.startsWith('blob:')) {
      console.log("🎯 VOICE_RECORDER - Initializing with permanent audio URL:", existingAudioUrl);
      setPermanentAudioUrl(existingAudioUrl.trim());
    }
  }, [existingAudioUrl]);

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
        if (reportId && user) {
          await uploadInterventionAudio({
            audioBlob: blob,
            reportId,
            userId: user.id,
            onUploadStart: () => setIsUploading(true),
            onUploadEnd: () => setIsUploading(false),
            onSuccess: (publicUrl) => {
              setPermanentAudioUrl(publicUrl);
              onAudioChange(blob);
            },
            onError: (error) => {
              console.error("🎯 VOICE_RECORDER - Upload failed:", error);
            }
          });
        } else {
          console.log("🎯 VOICE_RECORDER - No reportId, notifying parent");
          onAudioChange(blob);
        }
      }
    }, [onAudioChange, reportId, user])
  });

  const handleStartRecording = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎯 VOICE_RECORDER - Starting new recording");
    setPermanentAudioUrl(null);
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
    onAudioChange(null);
  }, [clearRecording, onAudioChange, reportId, permanentAudioUrl, user]);

  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setHasUserInteracted(true);
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleAudioPlay = () => setIsPlaying(true);
  const handleAudioPause = () => setIsPlaying(false);
  const handleAudioEnded = () => setIsPlaying(false);
  const handleAudioError = (e: any) => {
    console.log("🎯 VOICE_RECORDER - Audio error event (silent):", e);
  };

  const currentAudioUrl = permanentAudioUrl || audioUrl;

  console.log("🎯 VOICE_RECORDER - Current audio URL:", currentAudioUrl);

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

      {isUploading && (
        <div className="flex items-center justify-center text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm">Sauvegarde en cours...</span>
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
