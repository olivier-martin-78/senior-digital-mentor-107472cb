
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface AudioRecorderHook {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  clearRecording: () => void;
  transcribeAudio: () => Promise<string>;
  transcribing: boolean;
}

export function useAudioRecorder(): AudioRecorderHook {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // Arrêter tous les tracks du stream pour libérer le microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
      toast({
        title: "Erreur d'accès au microphone",
        description: "Vérifiez que vous avez autorisé l'accès au microphone pour ce site.",
        variant: "destructive",
      });
    }
  }, []);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);
  
  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
  }, [audioUrl]);
  
  const transcribeAudio = useCallback(async (): Promise<string> => {
    if (!audioBlob) {
      return '';
    }
    
    setTranscribing(true);
    
    try {
      // Convertir le blob audio en base64
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Enlever la partie "data:audio/webm;base64," du résultat
          resolve(base64.split(',')[1]);
        };
      });
      
      // Appeler une fonction edge sur Supabase pour la transcription
      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: base64Audio }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la transcription');
      }
      
      const result = await response.json();
      return result.text || '';
    } catch (error) {
      console.error("Erreur lors de la transcription:", error);
      toast({
        title: "Erreur de transcription",
        description: "Impossible de transcrire l'audio en texte.",
        variant: "destructive",
      });
      return '';
    } finally {
      setTranscribing(false);
    }
  }, [audioBlob]);
  
  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl, isRecording]);
  
  return {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
    transcribeAudio,
    transcribing,
  };
}
