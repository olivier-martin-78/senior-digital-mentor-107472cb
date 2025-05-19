
import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';
import useVoiceRecorder from '@/hooks/use-voice-recorder';
import RecordingControls from './RecordingControls';
import VoiceAnswerPlayer from './VoiceAnswerPlayer';
import { uploadRecording } from './utils/audioUtils';

interface VoiceAnswerRecorderProps {
  questionId: string;
  chapterId: string;
  existingAudio?: string | null;
  onRecordingComplete: (questionId: string, audioBlob: Blob, audioUrl: string) => void;
  onDeleteRecording: (questionId: string) => void;
}

export const VoiceAnswerRecorder: React.FC<VoiceAnswerRecorderProps> = ({
  questionId,
  chapterId,
  existingAudio,
  onRecordingComplete,
  onDeleteRecording
}) => {
  const { user } = useAuth();
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudio || null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { 
    isRecording, 
    audioBlob, 
    recordingTime, 
    startRecording, 
    stopRecording
  } = useVoiceRecorder({
    onRecordingComplete: (blob, tempUrl) => {
      // Only upload if we have a user
      if (user && user.id) {
        uploadAudioRecording(blob);
      } else {
        // For local testing without user
        onRecordingComplete(questionId, blob, tempUrl);
        setAudioUrl(tempUrl);
      }
    }
  });
  
  // Initialize audio URL from props if provided
  useEffect(() => {
    setAudioUrl(existingAudio || null);
  }, [existingAudio]);
  
  const uploadAudioRecording = (blob: Blob) => {
    if (!user || !user.id) return;
    
    uploadRecording(
      blob,
      user.id,
      chapterId,
      questionId,
      {
        onSuccess: (url) => {
          setAudioUrl(url);
          onRecordingComplete(questionId, blob, url);
        },
        onError: (errorMessage) => {
          toast({
            title: "Erreur de téléchargement",
            description: errorMessage,
            variant: "destructive",
          });
        },
        onUploadStart: () => setIsUploading(true),
        onUploadEnd: () => setIsUploading(false)
      }
    );
  };
  
  const handleDelete = () => {
    setAudioUrl(null);
    onDeleteRecording(questionId);
  };
  
  return (
    <div className="mt-2 p-3 border rounded-md bg-gray-50">
      <div className="text-sm font-medium mb-2">Réponse vocale</div>
      
      {isRecording || (!isUploading && !audioUrl) ? (
        <RecordingControls 
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />
      ) : (
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500">
            {audioUrl ? "Réponse vocale enregistrée" : "Prêt à enregistrer"}
          </span>
          {!audioUrl && !isUploading && (
            <button 
              className="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100"
              onClick={startRecording}
            >
              Enregistrer
            </button>
          )}
        </div>
      )}
      
      {isUploading && (
        <div className="flex justify-center items-center py-2 mb-2">
          <Spinner className="mr-2 h-4 w-4" />
          <span className="text-sm">Téléchargement en cours...</span>
        </div>
      )}
      
      {audioUrl && !isUploading && (
        <VoiceAnswerPlayer
          audioUrl={audioUrl}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default VoiceAnswerRecorder;
