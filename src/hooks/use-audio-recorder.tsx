
import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface AudioRecorderHook {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
}

export const useAudioRecorder = (): AudioRecorderHook => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  
  const startRecording = useCallback(async () => {
    audioChunks.current = [];
    try {
      console.log("Requesting media permissions...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log("Permission granted, creating MediaRecorder...");
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setIsRecording(false);
        
        // Arrêter tous les tracks du stream pour libérer le microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
      toast({
        title: "Erreur d'accès au microphone",
        description: "Veuillez vérifier que vous avez accordé les permissions nécessaires à votre navigateur.",
        variant: "destructive",
      });
    }
  }, []);
  
  const stopRecording = useCallback(async () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
    }
  }, [isRecording]);
  
  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
  }, [audioUrl]);
  
  return {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
  };
};

export default useAudioRecorder;
