
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Check } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onTranscriptionComplete 
}) => {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
    transcribeAudio,
    transcribing,
  } = useAudioRecorder();
  
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleTranscribe = async () => {
    setTranscriptionError(null);
    try {
      const text = await transcribeAudio();
      if (text) {
        onTranscriptionComplete(text);
        clearRecording();
      }
    } catch (error: any) {
      setTranscriptionError(error.message);
    }
  };
  
  return (
    <div className="border rounded-md p-4 bg-gray-50">
      <div className="text-sm font-medium mb-2">Enregistrement vocal</div>
      
      {transcriptionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur de transcription</AlertTitle>
          <AlertDescription>{transcriptionError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between mb-4">
        {isRecording ? (
          <>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <span className="text-red-500 font-medium">Enregistrement en cours ({formatTime(recordingTime)})</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={stopRecording}
              className="ml-2"
            >
              <Square className="w-4 h-4 mr-1" /> Arrêter
            </Button>
          </>
        ) : (
          <>
            <span className="text-gray-500">Prêt à enregistrer</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startRecording}
            >
              <Mic className="w-4 h-4 mr-1" /> Enregistrer
            </Button>
          </>
        )}
      </div>
      
      {audioUrl && (
        <div className="mb-4">
          <audio src={audioUrl} controls className="w-full" />
          
          <div className="flex mt-2 space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearRecording}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Supprimer
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTranscribe}
              disabled={transcribing}
              className="ml-auto"
            >
              {transcribing ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" /> Transcription...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" /> Utiliser cette réponse
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
