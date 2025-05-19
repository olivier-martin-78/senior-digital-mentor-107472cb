
import { useState, useRef, useCallback, useEffect } from 'react';
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
  const streamRef = useRef<MediaStream | null>(null);
  
  // Effet de nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      // Libération des ressources lors du démontage
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  const startRecording = useCallback(async () => {
    try {
      // Nettoyer les enregistrements précédents
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);
      audioChunks.current = [];
      
      console.log("Demande d'autorisation pour le microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      console.log("Autorisation accordée, création du MediaRecorder...");
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.current.onstop = () => {
        if (audioChunks.current.length > 0) {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          setAudioBlob(audioBlob);
          setAudioUrl(audioUrl);
        }
        
        setIsRecording(false);
        
        // Arrêter tous les tracks du stream pour libérer le microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.current.start();
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
  }, [audioUrl]);
  
  const stopRecording = useCallback(async () => {
    if (mediaRecorder.current && isRecording) {
      try {
        mediaRecorder.current.stop();
      } catch (error) {
        console.error("Erreur lors de l'arrêt de l'enregistrement:", error);
        
        // Nettoyage en cas d'erreur
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setIsRecording(false);
        
        toast({
          title: "Erreur d'enregistrement",
          description: "Un problème est survenu lors de l'arrêt de l'enregistrement.",
          variant: "destructive",
        });
      }
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
