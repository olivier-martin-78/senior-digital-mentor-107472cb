
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash, Volume2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';

interface VoiceAnswerRecorderProps {
  questionId: string;
  existingAudio?: string | null;
  onRecordingComplete: (questionId: string, audioBlob: Blob) => void;
  onDeleteRecording: (questionId: string) => void;
}

export const VoiceAnswerRecorder: React.FC<VoiceAnswerRecorderProps> = ({
  questionId,
  existingAudio,
  onRecordingComplete,
  onDeleteRecording
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudio || null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Initialize audio URL from props if provided
    setAudioUrl(existingAudio || null);
    
    return () => {
      stopRecording();
      if (audioUrl && audioUrl !== existingAudio) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [existingAudio]);
  
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);
  
  const startRecording = async () => {
    try {
      // Clean previous recording if exists
      if (audioUrl && audioUrl !== existingAudio) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioBlob(null);
      setAudioUrl(null);
      audioChunks.current = [];
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        if (audioChunks.current.length > 0) {
          const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          
          setAudioBlob(blob);
          setAudioUrl(url);
          
          // Send the recording to parent component
          onRecordingComplete(questionId, blob);
        }
        
        setIsRecording(false);
        
        // Stop all tracks of the stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      recorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
      setIsRecording(false);
      
      toast({
        title: "Erreur d'accès au microphone",
        description: "Veuillez vérifier que vous avez accordé les permissions nécessaires à votre navigateur.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
  };
  
  const handleDelete = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    
    if (audioUrl && audioUrl !== existingAudio) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    
    onDeleteRecording(questionId);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
  };
  
  const handleAudioPause = () => {
    setIsPlaying(false);
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };
  
  return (
    <div className="mt-2 p-3 border rounded-md bg-gray-50">
      <div className="text-sm font-medium mb-2">Réponse vocale</div>
      
      {isRecording ? (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
            <span className="text-red-500 font-medium">
              Enregistrement en cours ({formatTime(recordingTime)})
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={stopRecording}
            className="ml-2"
          >
            <Square className="w-4 h-4 mr-1" /> Arrêter
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500">
            {audioUrl ? "Réponse vocale enregistrée" : "Prêt à enregistrer"}
          </span>
          {!audioUrl && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startRecording}
            >
              <Mic className="w-4 h-4 mr-1" /> Enregistrer
            </Button>
          )}
        </div>
      )}
      
      {audioUrl && (
        <div>
          <div className="mb-2">
            <audio 
              ref={audioRef}
              src={audioUrl} 
              controls 
              className="w-full"
              onPlay={handleAudioPlay}
              onPause={handleAudioPause}
              onEnded={handleAudioEnded}
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              disabled={isPlaying}
            >
              <Trash className="w-4 h-4 mr-1" /> Supprimer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAnswerRecorder;
