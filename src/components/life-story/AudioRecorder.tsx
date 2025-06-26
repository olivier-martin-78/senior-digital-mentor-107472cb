
import React, { useState } from 'react';
import AudioRecorderCore from './audio/AudioRecorderCore';
import AudioUploadStatus from './audio/AudioUploadStatus';

interface AudioRecorderProps {
  chapterId: string;
  questionId: string;
  onAudioUrlChange: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
  onUploadStart?: () => void;
  shouldLog?: boolean;
}

export const AudioRecorder = ({ chapterId, questionId, onAudioUrlChange, onUploadStart, shouldLog = false }: AudioRecorderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
    console.log('🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Initialisation:', {
      chapterId,
      questionId,
      isUploading,
      uploadedAudioUrl,
      timestamp: new Date().toISOString()
    });
  }

  if (shouldLog && chapterId === 'chapter-1' && questionId === 'question-1') {
    console.log('🎙️ AUDIO_RECORDER - Question 1 Chapitre 1 - Rendu avec état:', { 
      isUploading, 
      uploadedAudioUrl,
      isSaving,
      isSaved,
      timestamp: new Date().toISOString()
    });
  }

  return (
    <div className={`transition-all ${isUploading || isSaving ? "opacity-60 pointer-events-none" : ""}`}>
      <AudioRecorderCore
        chapterId={chapterId}
        questionId={questionId}
        onAudioUrlChange={onAudioUrlChange}
        onUploadStart={onUploadStart}
        onUploadStateChange={setIsUploading}
        onSavingStateChange={setIsSaving}
        onSavedStateChange={setIsSaved}
        onAudioUrlUpdate={setUploadedAudioUrl}
        shouldLog={shouldLog}
      />
      
      <AudioUploadStatus
        isUploading={isUploading}
        isSaving={isSaving}
        isSaved={isSaved}
        uploadedAudioUrl={uploadedAudioUrl}
      />
    </div>
  );
};

export default AudioRecorder;
