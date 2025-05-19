
import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface AudioRecorderHook {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  recordingTime: number;
}

export const useAudioRecorder = (): AudioRecorderHook => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      stopAllRecording();
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);
  
  // Gestion du timer d'enregistrement
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);
  
  // Fonction pour arrêter l'enregistrement et libérer les ressources
  const stopAllRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      try {
        mediaRecorder.current.stop();
      } catch (error) {
        console.error("Erreur lors de l'arrêt forcé du MediaRecorder:", error);
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    mediaRecorder.current = null;
  }, []);
  
  const startRecording = useCallback(async () => {
    try {
      // Nettoyer les enregistrements précédents
      stopAllRecording();
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      setAudioBlob(null);
      audioChunks.current = [];
      setRecordingTime(0);
      
      console.log("Demande d'autorisation pour le microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      console.log("Autorisation accordée, création du MediaRecorder...");
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
          console.log("Enregistrement terminé, blob créé:", blob.size, "octets");
        } else {
          console.warn("Aucune donnée audio collectée");
        }
        
        setIsRecording(false);
        
        // Arrêter tous les tracks du stream
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
      setRecordingTime(0);
      
      toast({
        title: "Erreur d'accès au microphone",
        description: "Veuillez vérifier que vous avez accordé les permissions nécessaires à votre navigateur.",
        variant: "destructive",
      });
    }
  }, [stopAllRecording, audioUrl]);
  
  const stopRecording = useCallback(async () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      try {
        console.log("Arrêt de l'enregistrement...");
        mediaRecorder.current.stop();
      } catch (error) {
        console.error("Erreur lors de l'arrêt de l'enregistrement:", error);
        
        // Nettoyage forcé en cas d'erreur
        stopAllRecording();
        setIsRecording(false);
        setRecordingTime(0);
        
        toast({
          title: "Erreur d'enregistrement",
          description: "Un problème est survenu lors de l'arrêt de l'enregistrement.",
          variant: "destructive",
        });
      }
    } else {
      // Si déjà arrêté, assurons-nous que l'état est cohérent
      setIsRecording(false);
      setRecordingTime(0);
    }
  }, [stopAllRecording]);
  
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
    recordingTime
  };
};

export default useAudioRecorder;
